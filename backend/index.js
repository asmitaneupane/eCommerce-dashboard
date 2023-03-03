const express = require('express');
const cors = require('cors');
require('./db/config')
const User = require('./db/User')
const Product = require('./db/Product')

const Jwt = require('jsonwebtoken')
const secret = "hell0w0rld"

const app = express();
app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password
    Jwt.sign({ result }, secret, { expiresIn: '2h' }, (err, token) => {
        if (err) {
            res.send({ message: "Something went Wrong. Try Again Later!" })
        }
        res.send({ result, auth: token });
    })
})

app.post('/login', async (req, res) => {
    console.log(req.body);
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, secret, { expiresIn: '2h' }, (err, token) => {
                if (err) {
                    res.send({ message: "Something went Wrong. Try Again Later!" })
                }
                res.send({ user, auth: token });
            })
        }
        else {
            res.send({ result: 'No User Found!' })
        }
    } else {

        res.send({ result: 'No User Found' })
    }
})

app.post('/add-product', verfifyToken, async (req, res) => {
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
})

app.get('/products', verfifyToken, async (req, res) => {
    let products = await Product.find();
    if (products.length > 0) {
        res.send(products);
    } else {
        res.send({ result: "No Products Found!" })
    }
})

app.delete('/product/:id', verfifyToken, async (req, res) => {
    let result = await Product.deleteOne({ _id: req.params.id });
    res.send(result);
})

app.get('/product/:id', verfifyToken, async (req, res) => {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
        res.send(result)
    } else {
        res.send({ result: "No Record Match." })
    }
})

app.put('/product/:id', verfifyToken, async (req, res) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
        }
    );
    res.send(result);
})

app.get('/search/:key', verfifyToken, async (req, res) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { price: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
        ]
    });
    res.send(result);
})

//middleware (inside middleware, we get at least 3 parameters.)

function verfifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1],
            console.log("token", token);
        Jwt.verify(token, secret, (err, success) => {
            if (err) {
                res.status(401).send({ message: "Please provide Valid token." })
            } else {
                next();
            }
        })
    } else {
        res.status(403).send({ Message: "Please Add Token Header." });
    }
    // console.log("middleware called", token);
}

app.listen(5001)