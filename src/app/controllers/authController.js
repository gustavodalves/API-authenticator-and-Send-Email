const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');


const authConfig = require('../../config/auth.json')

const User = require('../models/User');

const router = express.Router();

function gerenerateToken(params = {}){
    return jwt.sign(params, authConfig.secret,{
        expiresIn: 90000,
    });
}

router.post('/register', async (req, res) => {

    const { email } = req.body
    try{

        if(await User.findOne({ email })) {
            return res.status(400).send({error: "email ja existe"})
        }
        const user = await User.create(req.body);

        user.password = undefined;

        return res.send({ user, 
            token: gerenerateToken({id: user.id}), 
        });
    }catch (err){
        return res.status(400).send({ error: 'FAILED'})
    }
});

router.post('/authenticate', async(req,res) => {
    const {email, password} = req.body;

    const user = await User.findOne({ email }).select('+password');

    if(!user)
        return res.status(400).send({ error: 'user not founded'});

    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({ error: "invalid password"});

    user.password = undefined;

    const token = jwt.sign({ id: user.id }, authConfig.secret, {
        expiresIn: 90000,
    });

    res.send({
        user, 
        token: gerenerateToken({id: user.id}),
    });
})

router.post('/forgot_password', async(req, res) =>{
    const {email} = req.body;

    try{
        const user = await User.findOne({email});

        if(!user) return res.status(400).send({ error: 'Email not founded' });

        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date();
        now.setHours(now.getHours() + 1);

        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                PasswordResetExpires: now,
            }
        });

        mailer.sendMail({
            to: email,
            from: 'gualves2001@icloud.com',
            template: 'auth/forgot_password',
            context: { token },
        },(err) =>{
            console.log(err)
            if(err) return res.status(400).send({ error: "Cannot send email"});

            return res.send();
        })

    }catch(err){
        res.status(400).send({erro: 'Erro on forgot password'});
        console.log(err)
    }
});

module.exports = app => app.use('/auth', router);