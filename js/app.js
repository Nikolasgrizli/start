//request
async function getData(page) {
	const response = await fetch(`https://swapi.dev/api/people/?page=${page ? page : 1}&format=json`);
	const data = await response.json();
	return data;
}

//helpers
const removeYearDecor = (str) => str.replace(/[A-Z]/g,'');
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
    constructor(parent, data){
        this.parent = parent;
        this.data = data;


        this.list = this.parent.querySelector('#list');
        this.cardsPerPage = this.parent.querySelector('#cardsPerPage');
        this.pagination = this.parent.querySelector('#pagination');


        //helper
        this.currentDate = '2023BBY';
        this.paginationIdNext = 'paginationNext';
        this.paginationIdPrev = 'paginationPrev';

        //cash
        this.innerCash = {};

        // It's illogical to do on the frontend, for these things we have to use parameters when querying
        // all such parts will be marked with this comment
        // start 0_o
        this.logicalFlag = this.pagination === '10' ? true : false;
        this.queue = [];
        // end 0_o

        this.init();
    }


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

            const   prev = document.querySelector('#'+this.paginationIdPrev),
                    next = document.querySelector('#'+this.paginationIdNext);

            [prev,next].forEach(item=>{
                item.addEventListener('click', (e)=>{
                    e.preventDefault();
                    if(!e.currentTarget.classList.contains('pagination__item_disable')){
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
        // console.log(this.parent)
        if(this.data?.results.length > 0){
            // console.log(this.list);
            this.list.innerHTML = '';
            this.data.results.forEach(item => {
                this.list.innerHTML += this.createLine(item)
            })
        }
    }


    init(){
        console.log('start');
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