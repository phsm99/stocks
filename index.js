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

app.get('/acao/:ticker', async (req, res) => {
    try {
        const retorno = await consultarValorAcao(req.params.ticker);
        res.json({ valor: retorno });
    } catch (error) {
        res.status(400).send({ error: error.toString() })
    }

})

app.get('/fii/:ticker', async (req, res) => {
    try {
        const retorno = await consultarValorFii(req.params.ticker);
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

const consultarValorAcao = async (ticker) => {
    if (!ticker) {
        throw new Error('Favor informar ticker!');
    }
    if (ticker.length < 5) {
        throw new Error('ticker incorreto');
    }
    const url = 'http://www.fundamentus.com.br/detalhes.php?papel=' + ticker
    let response = await axios.get(url);

    const html = response.data;
    const $ = cheerio.load(html);
    if ($.text().includes('Nenhum papel encontrado')) {
        throw new Error('ticker não encontrado');
    }
    else {
        let elementValue = $('.data.destaque.w3')
        let convertedValue = parseFloat(elementValue.text().replace(',', '.'))
        return convertedValue;
    }

}

const consultarValorFii = async (ticker) => {
    if (!ticker) {
        throw new Error('Favor informar ticker!');
    }
    if (ticker.length < 5) {
        throw new Error('ticker incorreto');
    }

    const url = 'http://www.fundamentus.com.br/detalhes.php?papel=' + ticker
    let response = await axios.get(url);

    const html = response.data;
    const $ = cheerio.load(html);
    if ($.text().includes('Nenhum papel encontrado')) {
        throw new Error('ticker não encontrado');
    }
    else {
        let elementValue = $('.data.destaque.w3')
        let convertedValue = parseFloat(elementValue.text().replace(',', '.'))
        return convertedValue;
    }
}