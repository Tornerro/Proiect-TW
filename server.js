let express = require('express')
let bodyParser = require('body-parser');
let session = require('express-session');
let crypto = require('crypto');
let app = express();
let port = 3000;

//Librarie necesara pentru a prelucra fisiere JSON
const fs = require('fs');


let rawdata = fs.readFileSync('data/users.json');
let userBD = JSON.parse(rawdata);

let rawdata2 = fs.readFileSync('data/jurnal.json');
let jurnalBD = JSON.parse(rawdata2);


app.use('/public', express.static('public'));
app.use(express.static("public"));






// Use this code as is. 
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, access-control-allow-origin")
    next();
});



app.use(session({
    secret: 'Batman', //folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
}));


app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




app.get('/', function (req, res) {
    res.render('home.ejs', { root: __dirname, user: req.session.user });
});



app.get('/jurnal', function (req, res) {

    userFound = {}
    if (req.session.user) {

        for (var i = 0; i < jurnalBD.length; i++) {
            if (req.session.user.username === jurnalBD[i].username) {
                userFound = jurnalBD[i];
            }
        }
    }
    //console.log(req.session.user)
    //console.log(userFound)
    res.render('jurnal.ejs', { root: __dirname, user: req.session.user, BD: userFound.jurnal });
});


app.get('/login', function (req, res) {
    res.render('login.ejs', { root: __dirname, user: req.session.user });
});



app.post('/login', function (req, res) {

    let ok = 0;
    let cifru = crypto.createCipher('aes-128-cbc', 'HarleyDavidson');
    let x = 0;

    let encrParola = cifru.update(req.body.parola, 'utf8', 'hex');

    encrParola += cifru.final('hex');
    console.log(req.body.username);
    userFound = {}
    for (let i = 0; i < userBD.length; i++) {
        if (userBD[i].username === req.body.username && userBD[i].parola === encrParola) {
            userFound = userBD[i];
            x = i;
            ok = 1;
            req.session.user = userBD[i];
        }
    }

    res.render('loginResult.ejs', { root: __dirname, user: req.session.user });
    if (ok == 0) return;

    userBD[x].nrlogs++;

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth())).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);

    userBD[x].yy = year;
    userBD[x].mm = month;
    userBD[x].dd = date;
    userBD[x].h = hours;
    userBD[x].m = minutes;
    userBD[x].s = seconds;

    var os = require('os');
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            userBD[x].lastip = iface.address;
        });
    });

    let data = JSON.stringify(userBD);
    fs.writeFileSync("data/users.json", data); //scriu in fisier


})


app.get('/add_obj', function (req, res) {
    console.log(req.session.user);
    res.render('addObj.ejs', { root: __dirname, user: req.session.user });
});

function add_object(k, objectData) {

    //console.log(req.session);
    jurnalBD[k]['jurnal']['obiecte'].push(objectData);
    jurnalBD[k]['jurnal']['nextID'] = parseInt(jurnalBD[k]['jurnal']['nextID']) + 1;
    //console.log(jurnalBD[k]['jurnal']);
    let data = JSON.stringify(jurnalBD);
    fs.writeFileSync("data/jurnal.json", data); //scriu in fisier

}

app.post('/add_obj', function (req, res) {
    //console.log(req.session.user);
    for (var i = 0; i < jurnalBD.length; i++) {
        if (req.session.user.username === jurnalBD[i].username) {
            add_object(i, {
                ...req.body,
                id: jurnalBD[i]['jurnal'].nextID
            });
        }
    }

    res.render('add_complete.ejs', { root: __dirname, user: req.session.user });
});

function delete_object(k, objectData) {
    let objId = objectData.deleteObject;
    jurnalBD[k]['jurnal']['obiecte'].forEach((obiect, index, listaObiecte) => {
        if (obiect['id'] == objId) {
            listaObiecte.splice(index, 1)
        }
    });
    let data = JSON.stringify(jurnalBD);
    fs.writeFileSync("data/jurnal.json", data); //scriu in fisier
}

app.post('/jurnal', function (req, res) {
    //console.log(req.body);
    for (var i = 0; i < jurnalBD.length; i++) {
        if (req.session.user.username === jurnalBD[i].username) {
            delete_object(i, req.body);
        }
    }
    res.render('delete_msg.ejs', { root: __dirname, user: req.session.user });
});

app.get('/logout', function (req, res) {

    req.session.destroy();
    res.sendFile('html/logout.html', { root: __dirname });
})

app.get('/varsta', function (req, res) {
    res.render('varsta.ejs', { root: __dirname, user: req.session.user });
});

app.use(function (req, res) {
    res.status(404).sendFile('html/404.html', { root: __dirname });
});

// Start the server
app.listen(port, () => {
    console.log(`Express.JS Server is running on http://localhost:${port}`)
});


