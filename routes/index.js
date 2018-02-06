const express = require('express');
const router = express.Router();
const passport = require('passport');
const Account = require('../models/account');
const task = "" +
    "По этой площадке должно быть сделано минимум 50 кликов " +
    "и если средняя глубина страниц <1,8," +
    " то компания добавляется в список запрещенных, " +
    "после этих действий должен приходить отчет," +
    " в котором прописаны площадки с ее показателями " +
    "и возможно сколько мы сэкономили в сумме, при добавление этих площадок";

const direct = require('../models/direct');
// direct.getClients().then(function (res) {
//     res.Clients.forEach(function (client) {
//         direct.getStat(client.Login, []).then(function (stats) {
//             console.log(stats);
//         })
//     })
// });
router.post('/setStats', function (req, res, next) {
    console.log(req.body);
    res.json(req.body);
});
router.get('/', function (req, res, next) {
    direct.getClients().then(function (result) {
            res.render('index', {clients: result.Clients});
    });
});

router.get('/register', function (req, res) {
    res.render('register', {});
});

router.post('/register', function (req, res) {
    Account.register(new Account({
        username: req.body.username
    }), req.body.password, function (err, account) {
        if(err) {
            return res.render('register', {error: err.message});
        }

        passport.authenticate('local')(req, res, function () {
            req.session.save(function (err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        })
    })
});

router.get('/login', function (req, res) {
    res.render('login', {user: req.user});
});

router.post('/login', passport.authenticate('local'), function (req, res) {
    res.redirect('/');
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
