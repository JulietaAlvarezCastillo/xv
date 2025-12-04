/*
// based on WholePageSlider
https://github.com/elansx/Wholepage-Slider
*/
function gallerySlider(options = {}) {
  this.container = options.containerId ? document.getElementById(options.containerId) : document.body
  this.sections = options.sectionClass ? document.getElementsByClassName(options.sectionClass) : document.getElementsByTagName('section')
  this.pageClass = options.pageClass ? options.pageClass : 'page'


  this.pagesPerSection = []
  this.currentPage = []
  this.currentSection = 0

  this.isDragging = false
  this.draggingPercent = 20

  this.waitAnimation = false
  this.timeToAnimate = options.animation?options.animation:500;

  this.height = 100
  this.width = 100

  this.swipeDirection = false;

  this.options = {
    ...options
  }
  this.translate = {
    section: 0,
    page: []
  }


  this.touches = {
    startX: null,
    startY: null,
    endX: null,
    endY: null
  }
  this.tooltip = document.getElementById('tooltip');
  this.nav_btns = document.getElementsByClassName('nav-control-btn');


  this.init();
  this.setupEventListeners();
  // this.color_pallete();
  // this.tooltips();
  // this.navButton_manager();
}
gallerySlider.prototype.init = function () {


  // Create elements for every section and apply styles
  const container = this.createElement('div', { className: 'sectionButtonContainer control d-flex flex-column gap-1' }, this.container);
  for (let index = 0; index < this.sections.length; index++) {
    var that = this;
    // Count and add page Starting position for every section
    if (this.sections.length > 1) {
      this.addSectionNavigation(index,container)
    }

    // Create navigation for pages only if there is more than 1 page per section
    this.translate.page[index] = 0
    this.currentPage[index] = 0
    this.pagesPerSection[index] = this.sections[index].getElementsByClassName(this.pageClass)
    if (this.pagesPerSection[index].length > 1) {
      let pageButtonContainer = this.createElement('div', { id: `pageButtonContainer[${index}]`, className: 'pageButtonContainer control d-flex gap-1' }, this.sections[index])
      let pages = this.pagesPerSection[index];

      for (let i = 0; i < pages.length; i++) {
        let pageSpan = parseInt(this.pagesPerSection[index][i].dataset.pageSpan,10)??1;
        if (isNaN(pageSpan) )  pageSpan = 1;
        if (pageSpan > 1) {
          this.pagesPerSection[index][i].style.setProperty('--width-multiplier', pageSpan);
          for(let k = 1; k<pageSpan;k++){
            const span = document.createElement('span');
            span.classList.add(this.pageClass)
            span.classList.add('d-none')
            this.pagesPerSection[index][i].parentNode.insertBefore(span, this.pagesPerSection[index][i].nextSibling);
          }
          this.pagesPerSection[index] = this.sections[index].getElementsByClassName(this.pageClass)
        }
      }
      for(let i = 0; i < this.pagesPerSection[index].length; i++) {
        this.addPageNavigation(index,i,pageButtonContainer);
      }
    }
  }
}

gallerySlider.prototype.addSectionNavigation  = function(index,container) {

  // Create radio button for every section
  const _id = `section-${index}`;
  this.createElement('input', {
    type: 'radio',
    name: 'sectionScrollButton',
    id: _id,//`sectionId[${index}]`,
    value: index,
    onclick: function (event) {
      if (this.waitAnimation) {
        return event.preventDefault()
      } else {
        this.gotoSection(event)
      }

    }.bind(this),
    checked: this.currentSection === index,
    style: {
      display: 'none'
    }
  },container);

  // Give some custom style for radio buttons with labels
  const label = this.createElement('label', { htmlFor: _id, className: 'btn btn-secondary'}, container);
  label.dataset.title = this.sections[index].dataset.title??'';
  label.dataset.tooltip = 'right';
  label.dataset.html = 'true';

}
gallerySlider.prototype.addPageNavigation  = function(index,pageIndex,container) {

  let _id= `page-${index}-${pageIndex}`;
  this.createElement('input', {
    type: 'radio',
    id: _id,
    name: `pagination[${index}]`,
    value: pageIndex,
    checked: this.currentPage[pageIndex] === pageIndex,
    onclick: function (event) {
      if (this.waitAnimation) {
        return event.preventDefault()
      } else {
        this.gotoPage(event)
      }

    }.bind(this),
    style: {
      display: 'none'
    }
  }, container);

  // Give some custom style for radio buttons with labels
  var label = this.createElement('label', { htmlFor: _id, className: 'btn btn-secondary' }, container);
  label.dataset.tooltip = 'top';
  label.dataset.title = `pagina ${(pageIndex+1)}`;
  label.dataset.html = 'true';
}
gallerySlider.prototype.createElement  = function(tag, options, parent) {
  try {
    const parentObject = (typeof parent === 'object') ? parent : document.getElementById(parent)
    const createdElement = document.createElement(tag)

    for (let key in options) {
      if (key === 'style') {
        for (let style in options[key]) {
          createdElement.style[style] = options[key][style]
        }
      } else if (key === 'onclick') {
        createdElement.addEventListener('click', options[key])
      } else {
        createdElement[key] = options[key]
      }
    }
    parentObject.appendChild(createdElement)
    return createdElement;
  } catch (error) {
    this.handleError('Unable to create buttons', error)
  }
}

gallerySlider.prototype.switchAndTranslate = function(_set = false) {
  // If we have no sections created or have to wait for animation to complete - return

  if (document.body.classList.contains("blocked") || !this.sections || this.waitAnimation ) {
    this.swipeDirection = false;
    return;
  } else {
    this.waitAnimation = true
  }

  if (this.swipeDirection) {
    if ( this.swipeDirection === 'down'  &&  this.currentSection < this.sections.length - 1) {
      this.currentSection++
      this.translate.section -= this.height
      this.sectionTranslate()
    }
    if ( this.swipeDirection === 'up' && this.currentSection > 0) {
      this.currentSection--
      this.translate.section += this.height
      this.sectionTranslate()
    }
    if (this.swipeDirection === 'right' && this.currentPage[this.currentSection] < this.pagesPerSection[this.currentSection].length - 1) {
      this.currentPage[this.currentSection]++
      this.translate.page[this.currentSection] -= this.width
      this.pageTranslate();
    }
    if ( this.swipeDirection === 'left' && this.currentPage[this.currentSection] > 0 ) {
      this.currentPage[this.currentSection]--
      this.translate.page[this.currentSection] += this.width
      this.pageTranslate();
    }
  }
  if (!this.swipeDirection && _set) {
    if(_set.type === 'section'){
      const index = _set.page - this.currentSection;
      this.currentSection = _set.page;
      this.translate.section = this.translate.section - (this.height * index);
      this.sectionTranslate()
    }
    if(_set.type === 'page'){
      const index =  _set.page - this.currentPage[this.currentSection];
      this.currentPage[this.currentSection] = _set.page;
      this.translate.page[this.currentSection] = this.translate.page[this.currentSection] - (this.width * index);
      this.pageTranslate();
    }
  }

  // This is needed to show active page on navigation buttons
  // section-${ index }
  document.getElementById(`section-${this.currentSection}`).checked = true
  document.getElementById(`page-${this.currentSection}-${this.currentPage[this.currentSection]}`).checked = true

  // Reset settings after swipe, drag or click ended
  this.isDragging = false
  this.width = 100
  this.height = 100

  // this.color_pallete();
  // Animate/translate sections

  // this.navButton_manager();
  // Complete previous animation before calling next
  setTimeout(() => {
    this.waitAnimation = false
  }, this.timeToAnimate)
}
gallerySlider.prototype.sectionTranslate = function(){
  for (let index = 0; index < this.sections.length; index++) {
    this.sections[index].style.transform = `translateY(${this.translate.section}dvh)`
  }
}
gallerySlider.prototype.pageTranslate = function(){
  for (let index = 0; index < this.pagesPerSection[this.currentSection].length; index++) {
    this.pagesPerSection[this.currentSection][index].style.transform = `translateX(${this.translate.page[this.currentSection]}dvw)`
  }
}

gallerySlider.prototype.handleError = function(string, error) {
  console.warn(`${string}: `, error)
}

gallerySlider.prototype.color_pallete = function () {
  var c_pallete = 'section_'+this.currentSection;
  var body = document.body;
  body.classList.remove('section_0', 'section_1', 'section_2', 'section_3', 'section_4');
  body.classList.add(c_pallete);

};

gallerySlider.prototype.setupEventListeners = function() {
  var self = this;
  window.onmousedown = this.touchStart.bind(this)
  window.onmouseup = this.touchEnd.bind(this)

  window.ontouchstart = this.touchStart.bind(this)
  window.ontouchend = this.touchEnd.bind(this)

  window.onwheel = this.swipeWithWheel.bind(this)
  window.onkeyup = this.swipeWithKeyboard.bind(this)
  // nav buttons
  for (var i = 0; i < this.nav_btns.length; i++) {
    this.nav_btns[i].addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      self.navControls(this);
    });
  }
}

gallerySlider.prototype.touchStart = function (event) {

  const void_target = event.target.closest('[data-avoid-scroll]')??false;
  const avoid = void_target?void_target.dataset.avoidScroll:void_target;
  if (avoid) return;

  this.isDragging = true
  this.swipeDirection = false;

  this.touches.startX = event.clientX ?? event.changedTouches[0].clientX;
  this.touches.startY = event.clientY ?? event.changedTouches[0].clientY;
}


gallerySlider.prototype.touchEnd = function (event) {
  if (!this.touches.startX || !this.touches.startY) return;

  this.touches.endX = event.clientX ?? event.changedTouches[0].clientX;
  this.touches.endY = event.clientY ?? event.changedTouches[0].clientY;

  const diferenceX = this.touches.startX - this.touches.endX
  const diferenceY = this.touches.startY - this.touches.endY

  if (Math.abs(diferenceX) > Math.abs(diferenceY)) {
    if((window.innerWidth * 0.2) < Math.abs(diferenceX)) this.swipeDirection = diferenceX > 0 ? 'right' : 'left'


  } else {
    if((window.innerHeight * 0.2) < Math.abs(diferenceY)) this.swipeDirection = diferenceY > 0 ? 'down' : 'up'
  }

  this.isDragging = false
  this.touches.startX = null
  this.touches.startY = null
  this.touches.endX = null
  this.touches.endY = null
  if (this.swipeDirection) {
    this.switchAndTranslate();
  }
  this.swipeDirection = false;
}


gallerySlider.prototype.swipeWithWheel = function(event) {

  const void_target = event.target.closest('[data-avoid-scroll]')??false;
  const avoid = void_target?void_target.dataset.avoidScroll:void_target;
  if (avoid) return;

  if (event.deltaY > 0 && event.deltaX == 0) this.swipeDirection = 'down'
  if (event.deltaY < 0 && event.deltaX == 0) this.swipeDirection = 'up'
  if (event.deltaY == 0 && event.deltaX < 0) this.swipeDirection = 'left'
  if (event.deltaY == 0 && event.deltaX > 0) this.swipeDirection = 'right'

  if (this.swipeDirection) {
    this.switchAndTranslate();
  }
  this.swipeDirection = false;
}
gallerySlider.prototype.swipeWithKeyboard = function(event) {

  this.swipeDirection = false;
  if (event.keyCode === 37 || event.code === 'ArrowLeft') this.swipeDirection = 'left'
  if (event.keyCode === 38 || event.code === 'ArrowUp')  this.swipeDirection = 'up'
  if (event.keyCode === 39 || event.code === 'ArrowRight') this.swipeDirection = 'right'
  if (event.keyCode === 40 || event.code === 'ArrowDown') this.swipeDirection = 'down'

  if (this.swipeDirection) {
    this.switchAndTranslate();
  }
  this.swipeDirection = false;

}
gallerySlider.prototype.gotoSection = function(event = false){
  if (this.waitAnimation) return;
  this.swipeDirection = false;
  const data = {
    type: 'section',
    page: parseInt(event.target.value,10)
  }
  this.switchAndTranslate(data);
  return;
}
gallerySlider.prototype.gotoPage = function(event = false){
  if (this.waitAnimation) return;
  this.swipeDirection = false;
  const data = {
    type: 'page',
    page: parseInt(event.target.value,10)
  }
  this.switchAndTranslate(data);
  return;
}
gallerySlider.prototype.navControls = function(obj){
  if (this.waitAnimation) return;
  this.swipeDirection = obj.value;
  this.switchAndTranslate();
  this.swipeDirection = false;
}
gallerySlider.prototype.navButton_manager = function(){
  if ( this.pagesPerSection[this.currentSection].length == (this.currentPage[this.currentSection]+1) ) {
    this.nav_btns.namedItem('nav-control-right').classList.add('disabled');
  } else {
    this.nav_btns.namedItem('nav-control-right').classList.remove('disabled');
  }
  if (this.currentPage[this.currentSection] == 0) {
      this.nav_btns.namedItem('nav-control-left').classList.add('disabled');
  }else {
    this.nav_btns.namedItem('nav-control-left').classList.remove('disabled');
  }
  if (this.pagesPerSection.length == (this.currentSection+1)) {
    this.nav_btns.namedItem('nav-control-bottom').classList.add('disabled');
  }else {
    this.nav_btns.namedItem('nav-control-bottom').classList.remove('disabled');
  }
  if (this.currentSection == 0) {
    this.nav_btns.namedItem('nav-control-top').classList.add('disabled');
  }else {
    this.nav_btns.namedItem('nav-control-top').classList.remove('disabled');
  }
}
module.exports = { gallerySlider }
