const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const Favorites = require("../models/favorite");

var authenticate = require("../authenticate");

const cors = require("./cors");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .populate("user")
            .populate("dishes")
            .then(
                (favorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorite) => {
                    if (favorite != null) {
                        var myArray = favorite.dishes;
                    } else {
                        var myArray = new Array();
                        favorite = new Favorites();
                        favorite.user = req.user._id;
                    }
                    req.body.forEach((elem) => {
                        if (myArray.indexOf(elem._id) === -1) {
                            favorite.dishes.push(elem._id);
                            myArray.push(elem._id);
                        }
                    });
                    favorite.save().then(
                        (favorite) => {
                            Favorites.findOne({ user: req.user._id })
                                .populate("user")
                                .populate("dishes")
                                .then((favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(favorite);
                                });
                        },
                        (err) => next(err)
                    );
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites");
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOneAndDelete({ user: req.user._id })
            .then(
                (resp) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(resp);
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    });

favoriteRouter
    .route("/:dishId")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorites) => {
                    if (!favorites) {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        return res.json({ exists: false, favorites: favorites });
                    } else {
                        if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            return res.json({ exists: false, favorites: favorites });
                        } else {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            return res.json({ exists: true, favorites: favorites });
                        }
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                // Not Done: not checking if the 'favorite' document doesn't exist
                (favorite) => {
                    // Not Done: not checking if the 'dishId' already exist in document
                    favorite.dishes.push(req.params.dishId);
                    favorite.save().then(
                        (favorite) => {
                            Favorites.findOne({ user: req.user._id })
                                .populate("user")
                                .populate("dishes")
                                .then((favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(favorite);
                                });
                        },
                        (err) => next(err)
                    );
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites/ " + req.params.dishId);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorite) => {
                    if (favorite != null && favorite.dishes.indexOf(req.params.dishId) !== -1) {
                        favorite.dishes.splice(favorite.dishes.indexOf(req.params.dishId), 1);
                        favorite.save().then(
                            (favorite) => {
                                Favorites.findOne({ user: req.user._id })
                                    .populate("user")
                                    .populate("dishes")
                                    .then((favorite) => {
                                        res.statusCode = 200;
                                        res.setHeader("Content-Type", "application/json");
                                        res.json(favorite);
                                    });
                            },
                            // Not Done: not deleting document if no favorite dish left
                            (err) => next(err)
                        );
                    } else if (favorite == null) {
                        err = new Error("Favorite not found for user " + req.user._id);
                        err.status = 404;
                        return next(err);
                    } else {
                        err = new Error("Dish " + req.params.dishId + " not found");
                        err.status = 404;
                        return next(err);
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;
