const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase:true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    workshop: {
        type:String,
        required:true,
        enum:['CTF','CTF+Workshop']
    },
    transactionid: {
        type: String,
        default:""
    },
    // challenges: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref:'Challenge'
    // },
    tokens: [{
        token: {
            type: String,
            required: true,
        },
        token_created_at: {
            type: Date,
            default: Date.now
        }
    }
    ]
})

//static signup method

userSchema.statics.signup = async function (name, email, phone, password,workshop,transactionid ) {
    if (!name || !email || !phone || !password || !workshop || (workshop.length >3 && !transactionid)) {
        throw Error('All fields must be filled');
    }
    if (!validator.isEmail(email)) {
        throw Error("Email is not valid");
    }
    if (phone.length !== 10) {
        throw Error("Phone Number have to be of length 10")
    }
    if (!validator.isStrongPassword(password)) {
        throw Error("Password is not strong enough");
    }

    const doesEmailExist = await this.findOne({ email });
    if (doesEmailExist) {
        throw Error("Email already exists");
    }
    const salt = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(password, salt);
    // const hash_cpassword = await bcrypt.hash(cpassword, salt);
    const user = new this({ name, email, phone, password: hash_password,workshop,transactionid});
    const userdata = await user.save();

    return userdata;

}

//static login method

userSchema.statics.login = async function (email, password) {
    if (!email || !password) {
        throw Error("All fields must be filled");
    }
    const userExists = await this.findOne({ email });
    console.log(userExists);
    if (!userExists) {
        throw Error("Invalid login details");
    }
    const comparePassword = await bcrypt.compare(password, userExists.password);
    if (!comparePassword) {
        throw Error("Invalid login credentials");
    }
    return userExists;
}

//token generation

userSchema.methods.generateAuthToken = async function (_id, email) {
    try {
        const TOKEN = jwt.sign({ _id, email }, process.env.SECRET_KEY, { expiresIn: '3d' });
        this.tokens = this.tokens.concat({ token: TOKEN });
        await this.save();
        return TOKEN;
    } catch (err) {
        console.log(err);
    }
}


module.exports = mongoose.model('User', userSchema);