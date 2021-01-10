const axios = require('axios')
const cheerio = require('cheerio')

const express = require('express');
const http = require('http');
const porta = process.env.PORT || 3333;
const app = express();
const server = http.Server(app);
var cors = require('cors')

app.use(cors())
app.use(express.json())

app.use('/public', express.static('public'));

app.get('/:ticket', async (req, res) => {
    try {
        const retorno = await consultarValorAcao(req.params.ticket);
        res.json({ valor: retorno });
    } catch (error) {
        res.status(400).send({ error: error.toString() })
    }

})

app.get('/', (request, response) => {
    return response.sendFile(__dirname + '/index.html')
})

server.listen(porta);
console.log('ouvindo na porta: ', porta);

const consultarValorAcao = async (ticket) => {
    if (!ticket) {
        throw new Error('Favor informar Ticket!');
    }
    if (ticket.length < 5) {
        throw new Error('Ticket incorreto');
    }
    const url = 'http://www.fundamentus.com.br/detalhes.php?papel=' + ticket
    let response = await axios.get(url);


    const html = response.data;
    const $ = cheerio.load(html);
    if ($.text().includes('Nenhum papel encontrado')) {
        throw new Error('Ticket não encontrado');
    }
    else {
        let elementValue = $('.data.destaque.w3')
        let convertedValue = parseFloat(elementValue.text().replace(',', '.'))
        return convertedValue;
    }

}