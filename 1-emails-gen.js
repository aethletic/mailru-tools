/**
 * Скрипт генерации почт на основе базы, для последующего чека на регистрацию в Mail.ru
 */

const args = process.argv;

/* Максимальное кол-во генерации почт
   Можно передать в виде аргумента
   Например: node app.js 10000
   По умолчанию 1000 шт. */
var COUNT_MAX = (args[2] > 0) ? args[2] : 1000;

/* Исходный файл с базой вида email:pass */
var FILE_SOURCE = 'var/base.txt';

/* Файл в который будут записаны сгенерированные почты */
var FILE_OUTPUT = 'var/emails.txt';

/* Символы для склейки слов в названии почты */
var SYMBOLS = ['.', '-', '_'];

const fs = require('fs');

var WORDS = [];
var EMAILS_CREATED = [];
var EMAILS = fs.readFileSync(FILE_SOURCE, 'utf8').trim().split('\n');

Array.prototype.sample = function() {
    return this[Math.floor(Math.random() * this.length)];
}

for (var i = 0; i < EMAILS.length; i++) {
    email = EMAILS[i].trim().toLowerCase().replace(/[_-]/g, '.').split('@').shift().split('.').forEach(value => WORDS.push(value.replace(/([^a-zA-Z0-9_\-.]+)/g, '')));
}

WORDS = Array.from(new Set(WORDS));
WORDS = WORDS.filter(Boolean);

console.log("Слов в базе: " + WORDS.length);

fs.writeFileSync(FILE_OUTPUT, '');

for (var i = 0; i < COUNT_MAX; i++) {
    var WORD_1 = WORDS.sample();
    var WORD_2 = WORDS.sample();
    var SYMBOL = SYMBOLS.sample();

    /* Проверяем на пустоту, чтобы избежать почт вида _ivanov, ivanov_*/
    if (WORD_1 == '' || WORD_2 == '') {
        i--;
        continue;
    }

    /* Создаем почту вида ivan.ivanov97 */
    if (isNumeric(WORD_1.slice(-1))) {
        email = WORD_2 + SYMBOL + WORD_1;
    } else {
        email = WORD_1 + SYMBOL + WORD_2;
    }

    if (email.length > 31) {
        console.log(i + '. ' + email + "@mail.ru слишком длинный, пересоздание ...");
        i--;
        continue;
    }

    if (email.length < 4) {
        console.log(i + '. ' + email + "@mail.ru слишком короткий, пересоздание ...");
        i--;
        continue;
    }

    if (EMAILS_CREATED.includes(email)) {
        console.log(i + '. ' + email + "@mail.ru уже был создан, пересоздание ...");
        i--;
        continue;
    }

    if (EMAILS.includes(email)) {
        console.log(i + '. ' + email + "@mail.ru существует в исходной базе, пересоздание ...");
        i--;
        continue;
    }

    EMAILS_CREATED.push(email);
    console.log(i + '. ' + email + "@mail.ru");
    fs.appendFileSync(FILE_OUTPUT, email + '@mail.ru\r\n');
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
