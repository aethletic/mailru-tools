/**
 * Скрипт проверки сгенерированных почт на регистрацию в Mail.ru
 */

const args = process.argv;

/* Интервал проверки, если меньше 200 мс., то возможен бан
   Можно передать в виде аргумента
   Например: node app.js 100
   По умолчанию 100 */
var INTERVAL = (args[2] > 0) ? args[2] : 100;

/* Файл с почтами для проверки */
var FILE_SOURCE = 'var/emails.txt';

/* Файл с почтами которые зарегистрированы в Mail.ru */
var FILE_EXISTS = 'var/emails-exists.txt';

/* Файл с почтами которые не зарегистрированы в Mail.ru */
var FILE_NOT_EXISTS = 'var/emails-not-exists.txt';

const fs = require('fs');
const path = require('path');
const colors = require('colors');
const request = require('request');
const Agent = require('socks5-https-client/lib/Agent');

var EMAILS_EXISTS = [];
var EMAILS_NOT_EXISTS = [];
var EMAILS = fs.readFileSync(FILE_SOURCE, 'utf8').trim().split('\r\n');

logger(colors.blue('Загружено почт: ' + EMAILS.length));
EMAILS = Array.from(new Set(EMAILS));
logger(colors.blue('Уникальных почт: ' + EMAILS.length));

let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
let stamp = date + '-' + month + '_' + hours + '-' + minutes + '-' + seconds;

if (fs.existsSync(FILE_EXISTS)) {
    fs.renameSync(FILE_EXISTS, 'var/archive/' + path.basename(FILE_EXISTS.replace('.txt', '') + '_' + stamp + '.txt'));
}
if (fs.existsSync(FILE_NOT_EXISTS)) {
    fs.renameSync(FILE_NOT_EXISTS, 'var/archive/' + path.basename(FILE_NOT_EXISTS.replace('.txt', '') + '_' + stamp + '.txt'));
}

fs.writeFileSync(FILE_EXISTS, '');
fs.writeFileSync(FILE_NOT_EXISTS, '');

const checker = setInterval(function() {
    if (EMAILS.length <= 0) {
        logger('Список пуст, ожидание завершения всех проверок.'.blue);
        clearInterval(checker);
    }

    email = EMAILS.shift();

    if (email == undefined) {
        return;
    }

    logger('Проверка - ' + email);

    (function(email) {

        request({
            url: 'https://account.mail.ru/api/v1/user/exists',
            method: 'POST',
            strictSSL: true,
            agentClass: Agent,
            agentOptions: {
                socksHost: '127.0.0.1', // TOR sock5 прокси
                socksPort: 9050,
            },
            form: {
                email: email
            }
        }, function(error, response, body) {

            if (body == undefined) {
                console.log(email + ' ----------- ПРОИЗОШЛА КАКАЯ-ТО ОШИБКА, ОТВЕТ ПУСТОЙ'.birghtRed);
                return;
            }

            body = JSON.parse(body);

            if (body.status == 403) {
                logger(colors.brightRed('Превышен лимит запросов, интервал ' + INTERVAL + ' слишком маленький.'));
                EMAILS.push(email); // в случае ошибки, пушим обратно текущую почту
                return;
            }

            if (body.status !== 200) {
                logger(body.status + ' Неизвестная ошибка.'.birghtRed);
                EMAILS.push(email); // в случае ошибки, пушим обратно текущую почту
                return;
            }

            if (body.body.exists) {
                EMAILS_EXISTS.push(email);
                fs.appendFileSync(FILE_EXISTS, email + '\r\n');
                logger(email.green + ' существует'.green);
                return;
            }

            EMAILS_NOT_EXISTS.push(email);
            fs.appendFileSync(FILE_NOT_EXISTS, email + '\r\n');
            logger(email.grey + ' не существует'.grey);
            return;
        });
    })(email);
}, INTERVAL);

function logger(text, emails = EMAILS, exists = EMAILS_EXISTS, not_exists = EMAILS_NOT_EXISTS) {
    console.log('[' + emails.length + '/' + exists.length + '/' + not_exists.length + '] ' + text);
}
