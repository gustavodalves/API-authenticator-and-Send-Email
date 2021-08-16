const express = require('express');

const gate = 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ 
    extended : false
}));

require('./app/controllers/index')(app);


app.listen(3000);
console.log("Servidor Rodando na porta ", gate);