/* Файл с базой почт */
var FILE_EMAILS = 'var/emails-exists.txt';

/* Файл с базой паролей */
var FILE_PASSWORDS = 'var/passwords.txt';

/* Файл в который будет записана сгенерированная база */
var FILE_OUTPUT = 'var/base-gen.txt';

/* Минимальная длина пароля, Mail.ru не принимает пароль меньше 8 символов
   По умолчанию: 8 */
var PASSWORD_MIN_LENGTH = 8;

/* Символ соединения базы email:pass
   По умолчанию: ":" */
var STRING_SEPARATOR = ':';

/* Тайм-аут перед стартом генерации */
var START_TIMEOUT = 3000;

/* Режим "дурачка", подбираются пароли ТОЛЬКО на основе логина почты
   Например: почта ivan.ivanov@mail.ru, создаются пароли ivan.ivanov, ivan.ivanov123, etc ... */
var DUMMY_MODE = true;

/* Пресеты для режима "дурачка", где {LOGIN} - это логин от почты
   Например ivan.ivanov@mail.ru --> ivan.ivanov2000 */
var DUMMY_PRESETS = [
    '{LOGIN}', '{LOGIN}1', '{LOGIN}', '{LOGIN}123',
    '{LOGIN}qwe', '{LOGIN}qwerty', '{LOGIN}2003', '{LOGIN}2004',
    '{LOGIN}2005', '{LOGIN}2002', '{LOGIN}2001', '{LOGIN}00',
    '{LOGIN}2000', '{LOGIN}99', '{LOGIN}98', '{LOGIN}97',
    '{LOGIN}96', '{LOGIN}a', '{LOGIN}aa', '{LOGIN}q', '{LOGIN}111', '{LOGIN}11',
    '1{LOGIN}','q{LOGIN}','!{LOGIN}','@{LOGIN}'
];

/* Создание комбинаций из логина почты, для последющей склейки с DUMMY_PRESETS
   Например, почта ivan.ivanov@mail.ru:
    {WORD_1} --> ivan
    {WORD_2} --> ivanov */
var DUMMY_PRESETS_SPLIT = [
    '{WORD_1}', '{WORD_2}', '{WORD_1}{WORD_2}', '{WORD_1}_{WORD_2}',
    '{WORD_1}-{WORD_2}', '{WORD_1}.{WORD_2}', '{WORD_1}{WORD_1}', '{WORD_2}{WORD_2}'
];

var BASE = [];
var STR_EMAIL_PASSWORD = '';
var LOGIN = '';
var EMAIL = '';
var PASSWORD = '';
var COUNT = 0;
const fs = require('fs');
const colors = require('colors');

var EMAILS = fs.readFileSync(FILE_EMAILS, 'utf8').trim().split('\n');

/* Нормализуем массив, потому что данные могут придти откуда угодно */
EMAILS = Array.from(new Set(EMAILS));
EMAILS = EMAILS.filter(Boolean);

console.log("Загружено почт: ".blue + EMAILS.length);

fs.writeFileSync(FILE_OUTPUT, '');

if (DUMMY_MODE) {
    console.log("Выбранный режим: dummy".yellow);
    console.log("Кол-во пресетов: ".blue + DUMMY_PRESETS.length);
    console.log("Кол-во сплит пресетов: ".blue + DUMMY_PRESETS_SPLIT.length);

    setTimeout(function() {
        for (var i = 0; i < EMAILS.length; i++) {
            EMAIL = EMAILS[i]
            LOGIN = EMAIL.split('@').shift();

            for (var ii = 0; ii < DUMMY_PRESETS.length; ii++) {
                PRESET = DUMMY_PRESETS[ii];
                PASSWORD = PRESET.replace('{LOGIN}', LOGIN);

                if (PASSWORD.length < PASSWORD_MIN_LENGTH) {
                    console.log("[" + COUNT + "]" + " [x] ".brightRed + "Пароль " + PASSWORD + " короче чем " + PASSWORD_MIN_LENGTH);
                    continue
                }

                STR_EMAIL_PASSWORD = EMAIL.trim() + STRING_SEPARATOR.trim() + PASSWORD.trim();

                if (BASE.includes(STR_EMAIL_PASSWORD)) {
                    continue;
                }

                COUNT++;
                fs.appendFileSync(FILE_OUTPUT, STR_EMAIL_PASSWORD + '\r\n');
                console.log("[" + COUNT + ']' + ' [✔] '.green + STR_EMAIL_PASSWORD);
                BASE.push(STR_EMAIL_PASSWORD);

                /* DUMMY_PRESETS_SPLIT */
                for (var iii = 0; iii < DUMMY_PRESETS_SPLIT.length; iii++) {
                    WORD = EMAIL.replace(/[_-]/g, '.').split('@').shift().split('.');
                    LOGIN = DUMMY_PRESETS_SPLIT[iii].replace(/{WORD_1}/gi, WORD[0].trim()).replace(/{WORD_2}/gi, WORD[1].trim());
                    PASSWORD = PRESET.replace('{LOGIN}', LOGIN).trim();

                    if (PASSWORD.length < PASSWORD_MIN_LENGTH) {
                        console.log("[" + COUNT + "]" + " [x] ".brightRed + "Пароль " + PASSWORD + " короче чем " + PASSWORD_MIN_LENGTH);
                        continue;
                    }

                    STR_EMAIL_PASSWORD = EMAIL.trim() + STRING_SEPARATOR.trim() + PASSWORD.trim();

                    if (BASE.includes(STR_EMAIL_PASSWORD)) {
                        continue;
                    }

                    COUNT++;
                    fs.appendFileSync(FILE_OUTPUT, STR_EMAIL_PASSWORD + '\r\n');
                    console.log("[" + COUNT + ']' + ' [✔] '.green + STR_EMAIL_PASSWORD);
                    BASE.push(STR_EMAIL_PASSWORD);
                }
            }
        };
    }, START_TIMEOUT);
} else {
    var PASSWORDS = fs.readFileSync(FILE_PASSWORDS, 'utf8').trim().split('\n');

    PASSWORDS = Array.from(new Set(PASSWORDS));
    PASSWORDS = PASSWORDS.filter(Boolean);

    console.log("Загружено паролей: ".blue + PASSWORDS.length);
    console.log("Кол-во комбинаций для генераций: ".blue + EMAILS.length * PASSWORDS.length);

    // TODO: ПЕРЕДЕЛАТЬ ЛУП НА for
    setTimeout(function() {
        EMAILS.forEach(function(EMAIL) {
            PASSWORDS.forEach(function(PASSWORD) {
                if (PASSWORD.length < PASSWORD_MIN_LENGTH) {
                    console.log(colors.brightRed("[x] Пароль " + PASSWORD + " короче чем " + PASSWORD_MIN_LENGTH));
                    return;
                }

                STR_EMAIL_PASSWORD = EMAIL.trim() + STRING_SEPARATOR.trim() + PASSWORD.trim();

                if (BASE.includes(STR_EMAIL_PASSWORD)) {
                    return;
                }

                fs.appendFileSync(FILE_OUTPUT, STR_EMAIL_PASSWORD + '\r\n');
                console.log('[✔] '.green + STR_EMAIL_PASSWORD);
                BASE.push(STR_EMAIL_PASSWORD);
            });
        });
    }, START_TIMEOUT);
}
