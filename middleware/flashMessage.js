module.exports = (req, res, next) => {
    res.locals.errorMessage = req.flash("error")[0] || null;
    res.locals.successMessage = req.flash("success")[0] || null;
    next();
}