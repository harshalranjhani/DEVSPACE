module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You need to be logged in to do that!');
        return res.redirect('/login');
    }
    next();
}