//request
// весь код в одном файле, это скорей минус. Будет достаточно сложно писать так большие приложения.
// даже на таком приложении я бы сделал файлы: api, constants, helpers, app.
// если мы используем класс, то для класса я бы тоже создал отдельный файл. Да, это может показаться громоздко, но это типа стандарт.
// думаю ты сталкивался уже когда в коде черт ногу сломит
async function getData(page) {
	const response = await fetch(`https://swapi.dev/api/people/?page=${page ? page : 1}&format=json`);
	const data = await response.json();
	return data;
}

//helpers
const removeYearDecor = (str) => str.replace(/[A-Z]/g,'');
// Я бы поаккуратнее работал со строками. Я бы пытался убрать именно "BBY"
// те, мы должны проработать несколько примеров:
// 112BBY
// 112
// unknown
// some-weird-text
// твой код для первого и второго случая выдает одинаковый результат, это ошибка

const ageCalculate = (str,dateNow) => {
    if(isNaN(Number(removeYearDecor(str)))) return 'Who knows?';
    return +removeYearDecor(dateNow) + +removeYearDecor(str);
}
const getNumPage = (str) => {
    const   linkUrl     = new URL(str),
            urlParams   = new URLSearchParams(linkUrl.search),
            page        = urlParams.get('page');

    return page && page || null;
}


//main class
class ListHandler{
    // очень странно передаешь данные в конструктор.... а класс же сам данные получает?
    constructor(parent, data){
        this.parent = parent;
        // очень плохое название переменной. data, item,
        this.data = data;


        this.list = this.parent.querySelector('#list');
        // не стесняйся удалять неиспользуемые данные. если правильно использовать гит-инструменты (ветки, коммиты)
        // можно и хранить код более логично и устраивать "эксперименты" в изолированном пространстве.
        this.cardsPerPage = this.parent.querySelector('#cardsPerPage');
        this.pagination = this.parent.querySelector('#pagination');


        //helper
        // через 10 дней твой код не будет работать. Почему не new Date()
        this.currentDate = '2023BBY';
        // конструктор определяет "состояние экземпляра класса". Разные экземпляры будут иметь одинаковые значения, поэтому к классу это отношение шибко не имеет.
        this.paginationIdNext = 'paginationNext';
        this.paginationIdPrev = 'paginationPrev';

        //cash
        // ок, то есть мы храним в переменно "дата" то, что мы отображаем на странице, а в переменной "иннер-кэш" все данные.
        // это неплохой подход, чтобы не перезапрашивать данные, которые мы уже запрашивали
        // но дублирование данных в целом это то, чего надо избегать. может на этом примере это не очевидно, но представь ты сможешь
        // радатировать имя персонажа. тебе нужно будет данные записывать в два места, иначе они будут рассинхронные.
        // я бы тут использовал метод "слайс виндоу" где все данные хранил в одном списке, а компонент бы знал с какого по какой номер
        // нужно отображать.
        this.innerCash = {};

        // It's illogical to do on the frontend, for these things we have to use parameters when querying
        // all such parts will be marked with this comment
        // start 0_o

        // да, ты прав, это надо делать на бэке. Но бэк у нас такой как есть, не всегда можно заменить связанные компоненты
        // эту задачу МОЖНО решить чисто на фронте и это не так является уж супер-сложным, но надо немного декомпозиторовать код,
        // разделить зоны ответственности, и слои: где у нас взаимодействие с сервером, где у нас "бизнес-логика" а где у нас "отображение".
        // в твоем случае этого разделения нет, даже кое-где слои явно пересекаются. вот это можно было бы улучшить.
        this.logicalFlag = this.pagination === '10' ? true : false;
        this.queue = [];
        // end 0_o

        this.init();
    }


    // передавать поле класса как аргумент - странная идея. этот метод же сам имеет доступ к this.data
    createPagination(listInfo){
        if(listInfo.next || listInfo.previous){
            const   prev    = listInfo.previous,
                    next    = listInfo.next;

            return `
                <button class="pagination__item pagination__item_prev ${prev ? '' : 'pagination__item_disable'}" id="${this.paginationIdPrev}" type="button" aria-label="previous page" data-link=${prev ? prev : ''}>Previous</button>
                <button class="pagination__item pagination__item_next ${next ? '' : 'pagination__item_disable'}" id="${this.paginationIdNext}" type="button" aria-label="next page" data-link=${next ? next : ''}>Next</button>
            `
        } else {
            return null;
        }
    }

    setPaginationHandler(){
        if(this.createPagination(this.data) && !!this.pagination){
            this.pagination.innerHTML = '';
            this.pagination.innerHTML = this.createPagination(this.data);

            // а вот ссылки на prev и next я бы наверное хранил в состоянии класса
            const   prev = document.querySelector('#'+this.paginationIdPrev),
                    next = document.querySelector('#'+this.paginationIdNext);

            [prev,next].forEach(item=>{
                item.addEventListener('click', (e)=>{
                    e.preventDefault();
                    // ты "хранишь" состояниие в дом-дереве, это не то что мы хотим.
                    if(!e.currentTarget.classList.contains('pagination__item_disable')){
                        // да ты и ссылку хранишь в кнопке. это совсем не то что мы хотим
                        this.getAnotherPage(e.currentTarget.dataset.link)
                    }
                })
            })



        }
    }

    createLine(lineObj){
        const {
                name,
                birth_year,
                height
        } = lineObj;

        const   age = ageCalculate(birth_year, this.currentDate);

        return `
            <li class="list__item listItem">
                <div class="listItem__part listItem__part_1">
                    <div class="listItem__label">Name</div>
                    <div class="listItem__data">${name}</div>
                </div>
                <div class="listItem__part listItem__part_1">
                    <div class="listItem__label">Age</div>
                    <div class="listItem__data">${age}</div>
                </div>
                <div class="listItem__part listItem__part_1">
                    <div class="listItem__label">Height</div>
                    <div class="listItem__data">${height}</div>
                </div>
            </li>
        `
    }


    // start 0_o
    todoQueue(){

    }
    // end 0_o

    setCashedData(id){
        if(this.data?.results.length > 0){
            if(!this.innerCash.hasOwnProperty(id)){
                this.innerCash[id] = this.data;
            }
            console.log(this.innerCash)
        }
    }

    render(){
        console.log("render")
        if(this.data?.results.length > 0){
            // console.log(this.list);
            this.list.innerHTML = '';
            this.data.results.forEach(item => {
                this.list.innerHTML += this.createLine(item)
            })
        }
    }


    init(){
        // консоль логи надо конечно убирать. плюс дебажить консоль логами это не то, что мы хотим.
        console.log('start', XXX);
        getData().then((data) => {
            this.data = data;
            this.setPaginationHandler();
            this.render();
            this.setCashedData(1);
        })


    }


    getAnotherPage(link){

        this.list.innerHTML = '<li class="placeholder">loading.....</li>';
        this.pagination.innerHTML = '';
        const page = getNumPage(link);


        if(page){
            // вложенные ифы это не очень... надо стараться писать код без вложенных ифов.
            if(this.innerCash.hasOwnProperty(page)){
                this.data = this.innerCash[page];
                this.setPaginationHandler();
                this.render();
            } else {
                getData(page).then((data) => {
                    this.data = data;
                    this.setPaginationHandler();
                    this.render();
                    this.setCashedData(page);
                })
            }
        // я так понимаю ты тут обрабатываешь некоторую ошибку, типа "а что если page==null?
        // но ты не сигнализируешь об ошибке, ты ее обрабатываешь молча.
        // тут сразу два момента: мы обрабатываем какую-то странную ошибку, которая не ожидается
        // плюс мы обрабатываем ее через иф а не через try {} catch(){}
        }


    }

}





const wrapper = document.getElementById('wrapper');
if(!!wrapper){
    const listHandled = new ListHandler(wrapper);
    // getData().then((data) => {
        // console.log(data)
        // const listHandled = new ListHandler(wrapper, data);
    // })
}
