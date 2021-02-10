require('dotenv').config();
const express = require('express')
const app = express()
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser');
var tmi = require('tmi.js');
const { emit } = require('process')
var request = require('request');
const audio = require('sound-play')

var http = require('http').createServer(app);
const option = { cors: { origin: "*" } };
var io = require('socket.io')(http,option);

const { response } = require('express');
const Commands = require('./modulos/Commands')

const WebSocket = require('ws')
const wss = new WebSocket.Server({port:8082})


var serverPort = process.env.PORT || 3000;

var at = ""
var id_user = "" //Variavel para guardar a id do usuario que vai usar o bot, para consultar follow e etc...

var options = {
    options: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: "AngaroDev",
        password: process.env.SENHATMI
    },
        channels: ["angarodev"]
    };
    const client = new tmi.client(options);
    const cmd = new Commands(client)
    client.connect();
    
    this.ellapsedTime = null;

//Config
    //Template Engine
    app.engine('handlebars', handlebars({defaultLayout: 'main'}))
    app.set('view engine', 'handlebars')
//Body Parser
    app.use(bodyParser.urlencoded({extended: false}))
    app.use(bodyParser.json())
//Express
    app.use(express.static(__dirname +'/public'))

//Rotas

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/alerts', (req, res) => {
    res.render('alertas')
})

app.get('/overlayer/:channel', function(req, res){
    res.redirect("https://id.twitch.tv/oauth2/authorize?client_id=" + process.env.CLIENT_ID + "&redirect_uri=" + process.env.URL_REDIRECT + "&response_type=code&scope=channel:read:subscriptions+bits:read+user:read:email")
 
})

app.get('/callback', function(req, res){
    getToken("", req.query.code, (response) => {
        var access_token = response.access_token
        var expires_in = response.expires_in
        var token_type = response.token_type
        console.log(response)
        res.render('overlayer', {
            at: access_token
        })
    })
})

app.get('/follow', function(req, res) {
    if(at != ""){
        getIdUser("https://api.twitch.tv/helix/users?login="+options.identity.username, at, (response) => {            
            getFollow(response.body.data[0].id, at, (response) => {
                res.send(response.body.data[0].from_name)
            })
        })
    }else{
        res.send("") //Aqui só pra não mostrar nadda quando não existe o Access_Token
    }
})

app.get('/canal', function(req, res){
    getChannel(at, "angarodonordeste", (response) => {
        console.log("--------------------")
        console.log(response.body)
    })
})



//TMI Canal de Mensagens
client.on("message", mensagemChegou) //Chama A função quando alguma mensagem é recebida no chat.

client.on("connected", (address, port) => {
    console.log("Bot Online no chat")
})

client.on("notice", (channel, msgid, message) => {
    console.log("---------------------")
    console.log(msgid)
});


// client.on("join", (channel, username, method, message, userstate) => {
//     client.action(channel, "Entrou no chat" + username)
//     console.log(username)
// })

function mensagemChegou(channel, user, message, self){
    if(self) return;

    if(message.toLowerCase().substr(0,4) === "!so "){
        var userSO = message.toLowerCase().substr(5).replase("@", "")//Tira o @ se tiver
        getIdUser("https://api.twitch.tv/helix/users?login="+userSO, at, (response) => {
            if(!response.body.data[0]) { //Verifica se a resposta tem dados ou não
                cmd.seformod(channel, user, "Oxi, esse usuario não conseguir encontrar")
            }else{
                var dados = [
                    fotoUser = response.body.data[0].profile_image_url, 
                    username = response.body.data[0].display_name
                ]
                io.emit("overlayer", dados)
                cmd.seformod(channel, user, "Segue nosso amigo também https://twitch.tv/"+ message.substr(5),io)
            }      
        })
        
    }

    //Enquanto não sei usar o Webhook, uso a mensagem que o streamlabs manda no chat
    if(user['display-name'].toLowerCase() == "streamlabs" && message.substring(0,23) == "Thank you for following"){
        var data = [
            tipo = "Follow",
            mensagem = user['display-name']
        ]
        io.emit("alertas", data)
    }
}

//Inicializa o Sokect.io
io.on('connection', (socket) => {
    socket.on("joinRoom", (channel) => {
        console.log(channel)
    })
})
io.on('disconnect', (socket) => {
    console.log("Cliente id: " + socket.id + " desconectou.")
})

//Eventos TMI

client.on("subscription", (channel, user, message, self) => { //Novo Sub
    var data = [
        tipo = "Sub",
        mensagem = user + " é novo Sub"
    ]
    io.emit("alertas", data)
});

client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {// GiftSubs 
    let senderCount = ~~userstate["msg-param-sender-count"];
    var data = [
        tipo = "Sub",
        mensagem = username + " deu " + senderCount + " giftsubs"
    ]
    io.emit("alertas", data)
});

client.on("resub", (channel, username, months, message, userstate, methods) => {// Resub
    // Do your stuff.
    let cumulativeMonths = ~~userstate["msg-param-cumulative-months"];
    var data = [
        tipo = "Sub",
        mensagem = username + " é um sub a " + cumulativeMonths + " meses"
    ]
    io.emit("alertas", data)
});

client.on("raided", (channel, username, viewers) => {// Raid
    //Ainda não tenho imagem pra quando é uma Raid, ent vou colocar do SO
    // var data = [
    //     tipo = "Sub",
    //     mensagem = user['display-name'] + " é um sub a " + cumulativeMonths + " meses"
    // ]
    // io.emit("alertas", data)
    getIdUser("https://api.twitch.tv/helix/users?login="+username, at, (response) => {
        if(!response.body.data[0]) { //Verifica se a resposta tem dados ou não
            cmd.seformod(channel, user, "Oxi, esse usuario não conseguir encontrar")
        }else{
            var dados = [
                fotoUser = response.body.data[0].profile_image_url, 
                username = response.body.data[0].display_name
            ]
            io.emit("overlayer", dados)
            client.say(channel, "Segue nosso amigo também https://twitch.tv/"+ username)
        }      
    })
});

//Obter o Token do usuario twitch
const getToken = (url, code, callback) => {
    var options = {
        url: "https://id.twitch.tv/oauth2/token",
        json: true,
        body: {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            redirect_uri: process.env.URL_REDIRECT,
            code: code,
            grant_type: 'authorization_code'
        }
    }
    request.post(options, (err, res, body) => {
        if(err){
            return console.log(err)
        }
        at = body.access_token //Armazena o Acess Token, na variavel
        callback(body)
        return at;
    })
}

const getChannel = (at, canal, callback) => {
    var options = {
        url: "https://api.twitch.tv/helix/search/channels?query="+canal,
        json: true,
        method: 'GET',
        headers:{
            'Authorization': 'Bearer ' + at,
            'Client-ID': process.env.CLIENT_ID
        }
    }
    request.get(options, (err, res, body) => {
        if(err){
            return console.log(err)
        }
        callback(res)
    })
}

//Obtem os dados do usuario para consultar em outras funções ex: Numero de Follow.
const getIdUser = (url, at, callback) => {
    const options = {
        url: url,
        json: true,
        method: 'GET',
        headers:{
            'Authorization': 'Bearer ' + at,
            'Client-ID': process.env.CLIENT_ID
        }
    }
    request.get(options, (err, res, body) => {
        if(err){
            return console.log(err)
        }
        id_user = res.body.data[0].id
        callback(res)
    })
}

//Obter Follows
const getFollow = (userId, at,callback) => {
    const options = {
        url: "https://api.twitch.tv/helix/users/follows?to_id="+userId,
        json: true,
        method: 'GET',
        headers:{
            'Authorization': 'Bearer ' + at,
            'Client-ID': process.env.CLIENT_ID
        }
    }
    request.get(options, (err, res, body) => {
        if(err){
            return console.log(err)
        }
        callback(res)
    })
}

/////////////////////
http.listen(serverPort, function(){
})