async function loginController(req, res) {
    res.send('This is the login controller');

}
async function logoutController(req, res) {
    res.send('This is the logout controller');
}

module.exports = { loginController, logoutController }