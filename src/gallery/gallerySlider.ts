/*
// based on WholePageSlider
https://github.com/elansx/Wholepage-Slider
*/

interface GallerySliderOptions {
  containerId?: string;
  sectionClass?: string;
  pageClass?: string;
  animation?: number;
  [key: string]: any;
}

interface Touches {
  startX: number | null;
  startY: number | null;
  endX: number | null;
  endY: number | null;
}

interface Translate {
  section: number;
  page: number[];
}

type SwipeDirection = 'up' | 'down' | 'left' | 'right' | false;

class GallerySlider {
  private container: HTMLElement;
  private sections: HTMLCollection;
  private pageClass: string;
  private pagesPerSection: HTMLCollection[];
  private currentPage: number[];
  private currentSection: number;

  private waitAnimation: boolean;
  private timeToAnimate: number;
  private height: number;
  private width: number;
  private swipeDirection: SwipeDirection;

  private translate: Translate;
  private touches: Touches;

  private nav_btns: HTMLCollection;

  constructor(options: GallerySliderOptions = {}) {
    this.container = options.containerId ? document.getElementById(options.containerId) as HTMLElement : document.body;
    this.sections = options.sectionClass
      ? document.getElementsByClassName(options.sectionClass)
      : document.getElementsByTagName('section');
    this.pageClass = options.pageClass ? options.pageClass : 'page';

    this.pagesPerSection = [];
    this.currentPage = [];
    this.currentSection = 0;

    // this.isDragging = false;
    // this.draggingPercent = 20;

    this.waitAnimation = false;
    this.timeToAnimate = options.animation ?? 500;

    this.height = 100;
    this.width = 100;

    this.swipeDirection = false;

    // this.options = { ...options };

    this.translate = {
      section: 0,
      page: []
    };

    this.touches = {
      startX: null,
      startY: null,
      endX: null,
      endY: null
    };

    // this.tooltip = document.getElementById('tooltip');
    this.nav_btns = document.getElementsByClassName('nav-control-btn');

    this.init();
    this.setupEventListeners();
    this.color_pallete();
    // this.tooltips();
    this.navButton_manager();
  }

  private init(): void {
    // Create elements for every section and apply styles
    const container = this.createElement('div', { className: 'sectionButtonContainer control d-flex flex-column gap-1' }, this.container);

    for (let index = 0; index < this.sections.length; index++) {
      // Count and add page Starting position for every section
      if (this.sections.length > 1) {
        this.addSectionNavigation(index, container);
      }

      // Create navigation for pages only if there is more than 1 page per section
      this.translate.page[index] = 0;
      this.currentPage[index] = 0;
      this.pagesPerSection[index] = this.sections[index].getElementsByClassName(this.pageClass);
      this.setStateClases( this.sections as HTMLCollection, 'section' )
      this.setStateClases( this.pagesPerSection[this.currentSection] as HTMLCollection, 'page' )

      if (this.pagesPerSection[index].length > 1) {
        const pageButtonContainer = this.createElement('div', { id: `pageButtonContainer[${index}]`, className: 'pageButtonContainer' }, this.sections[index] as HTMLElement);
        const pages = this.pagesPerSection[index];

        for (let i = 0; i < pages.length; i++) {
          let pageSpan = parseInt((pages[i] as HTMLElement).dataset.pageSpan || '1', 10);
          if (isNaN(pageSpan)) pageSpan = 1;
          if (pageSpan > 1) {
            (pages[i] as HTMLElement).style.setProperty('--width-multiplier', pageSpan.toString());
            for (let k = 1; k < pageSpan; k++) {
              const span = document.createElement('span');
              span.classList.add(this.pageClass);
              span.classList.add('d-none');
              pages[i].parentNode?.insertBefore(span, pages[i].nextSibling);
            }
            this.pagesPerSection[index] = (this.sections[index] as HTMLElement).getElementsByClassName(this.pageClass);
          }
        }

        for (let i = 0; i < this.pagesPerSection[index].length; i++) {
          this.addPageNavigation(index, i, pageButtonContainer);
        }
      }
    }
  }

  private setStateClases(elements:HTMLCollection, type:string):void{
    for (let index = 0; index < elements.length; index++) {;
      elements[index].classList.remove(`${type}-past`,`${type}-future`, `${type}-current`)
      if(index < this.currentSection){
        elements[index].classList.add(`${type}-past`)
      }
      if(index > this.currentSection){
        elements[index].classList.add(`${type}-future`)
      }
      if(index == this.currentSection){
        elements[index].classList.add(`${type}-current`)
      }
    }
  }

  private addSectionNavigation(index: number, container: HTMLElement): void {
    // Create radio button for every section
    const _id = `section-${index}`;

    this.createElement('input', {
      type: 'radio',
      name: 'sectionScrollButton',
      id: _id,
      value: index,
      onclick: (event: Event) => {
        if (this.waitAnimation) {
          event.preventDefault();
        } else {
          this.gotoSection(event);
        }
      },
      checked: this.currentSection === index,
      style: {
        display: 'none'
      }
    }, container);

    // Give some custom style for radio buttons with labels
    const label = this.createElement('label', { htmlFor: _id, className: 'btn btn-secondary' }, container);
    (label as HTMLElement).dataset.title = (this.sections[index] as HTMLElement).dataset.title ?? '';
    (label as HTMLElement).dataset.tooltip = 'right';
    (label as HTMLElement).dataset.html = 'true';
  }

  private addPageNavigation(index: number, pageIndex: number, container: HTMLElement): void {
    const _id = `page-${index}-${pageIndex}`;

    this.createElement('input', {
      type: 'radio',
      id: _id,
      name: `pagination[${index}]`,
      value: pageIndex,
      checked: this.currentPage[index] === pageIndex,
      onclick: (event: Event) => {
        if (this.waitAnimation) {
          event.preventDefault();
        } else {
          this.gotoPage(event);
        }
      },
      style: {
        display: 'none'
      }
    }, container);

    // Give some custom style for radio buttons with labels
    const label = this.createElement('label', { htmlFor: _id, className: 'btn btn-secondary' }, container);
    (label as HTMLElement).dataset.tooltip = 'top';
    (label as HTMLElement).dataset.title = `pagina ${pageIndex + 1}`;
    (label as HTMLElement).dataset.html = 'true';
  }

  private createElement(tag: string, options: any, parent: HTMLElement | string): HTMLElement {
    try {
      const parentObject = typeof parent === 'object' ? parent : document.getElementById(parent as string) as HTMLElement;
      const createdElement = document.createElement(tag);

      for (const key in options) {
        if (key === 'style') {
          for (const style in options[key]) {
            (createdElement as any).style[style] = options[key][style];
          }
        } else if (key === 'onclick') {
          createdElement.addEventListener('click', options[key]);
        } else {
          (createdElement as any)[key] = options[key];
        }
      }
      parentObject.appendChild(createdElement);
      return createdElement;
    } catch (error) {
      this.handleError('Unable to create buttons', error as Error);
      throw error;
    }
  }

  private switchAndTranslate(_set: { type: string; page: number } | boolean = false): void {
    // If we have no sections created or have to wait for animation to complete - return
    if (document.body.classList.contains("blocked") || !this.sections || this.waitAnimation) {
      this.swipeDirection = false;
      return;
    } else {
      this.waitAnimation = true;
    }

    if (this.swipeDirection) {
      if (this.swipeDirection === 'down' && this.currentSection < this.sections.length - 1) {
        this.currentSection++;
        this.translate.section -= this.height;
        this.sectionTranslate();
      }
      if (this.swipeDirection === 'up' && this.currentSection > 0) {
        this.currentSection--;
        this.translate.section += this.height;
        this.sectionTranslate();
      }
      if (this.swipeDirection === 'right' && this.currentPage[this.currentSection] < this.pagesPerSection[this.currentSection].length - 1) {
        this.currentPage[this.currentSection]++;
        this.translate.page[this.currentSection] -= this.width;
        this.pageTranslate();
      }
      if (this.swipeDirection === 'left' && this.currentPage[this.currentSection] > 0) {
        this.currentPage[this.currentSection]--;
        this.translate.page[this.currentSection] += this.width;
        this.pageTranslate();
      }
    }

    if (!this.swipeDirection && _set) {
      if ((_set as any).type === 'section') {
        const index = (_set as any).page - this.currentSection;
        this.currentSection = (_set as any).page;
        this.translate.section = this.translate.section - (this.height * index);
        this.sectionTranslate();
      }
      if ((_set as any).type === 'page') {
        const index = (_set as any).page - this.currentPage[this.currentSection];
        this.currentPage[this.currentSection] = (_set as any).page;
        this.translate.page[this.currentSection] = this.translate.page[this.currentSection] - (this.width * index);
        this.pageTranslate();
      }
    }

    // This is needed to show active page on navigation buttons
    // section-${ index }
    const sectionRadio = document.getElementById(`section-${this.currentSection}`) as HTMLInputElement;
    const pageRadio = document.getElementById(`page-${this.currentSection}-${this.currentPage[this.currentSection]}`) as HTMLInputElement;

    if (sectionRadio) sectionRadio.checked = true;
    if (pageRadio) pageRadio.checked = true;

    // Reset settings after swipe, drag or click ended
    // this.isDragging = false;
    this.width = 100;
    this.height = 100;

    // Complete previous animation before calling next
    setTimeout(() => {
      this.waitAnimation = false;
    }, this.timeToAnimate);
  }

  private sectionTranslate(): void {
    const sectionTranslateEvent = new CustomEvent('sectionTanslate', {
      detail: {
        scroll: `${this.translate.section}`,
        index: this.currentSection
      },
      bubbles: true, // Allows the event to bubble up the DOM tree
      cancelable: true // Allows the event to be canceled
    });
    document.dispatchEvent(sectionTranslateEvent);
    this.setStateClases( this.sections as HTMLCollection, 'section' )
    for (let index = 0; index < this.sections.length; index++) {
      (this.sections[index] as HTMLElement).style.transform = `translateY(${this.translate.section}dvh)`;
    }
  }

  private pageTranslate(): void {
    this.setStateClases( this.pagesPerSection[this.currentSection] as HTMLCollection, 'page' )
    for (let index = 0; index < this.pagesPerSection[this.currentSection].length; index++) {
      (this.pagesPerSection[this.currentSection][index] as HTMLElement).style.transform = `translateX(${this.translate.page[this.currentSection]}dvw)`;
    }
  }

  private handleError(string: string, error: Error): void {
    console.warn(`${string}: `, error);
  }

  private color_pallete(): void {
    var c_pallete = 'section_' + this.currentSection;
    var body = document.body;
    body.classList.remove('section_0', 'section_1', 'section_2', 'section_3', 'section_4');
    body.classList.add(c_pallete);
  }

  private setupEventListeners(): void {
    // Mouse events
    window.addEventListener('mousedown', this.touchStart.bind(this));
    window.addEventListener('mouseup', this.touchEnd.bind(this));

    // Touch events
    window.addEventListener('touchstart', this.touchStart.bind(this), { passive: false });
    window.addEventListener('touchend', this.touchEnd.bind(this));

    // Wheel events
    window.addEventListener('wheel', this.swipeWithWheel.bind(this), { passive: false });

    // Keyboard events
    window.addEventListener('keyup', this.swipeWithKeyboard.bind(this));

    // Nav buttons
    for (let i = 0; i < this.nav_btns.length; i++) {
      this.nav_btns[i].addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.navControls(this.nav_btns[i] as HTMLElement);
      });
    }
  }

  private touchStart(event: MouseEvent | TouchEvent): void {
    const touchEvent = event as TouchEvent;
    const mouseEvent = event as MouseEvent;

    const target = 'touches' in event ? touchEvent.touches[0] : mouseEvent;
    const targetElement = event.target as Element;

    const void_target = targetElement.closest('[data-avoid-scroll]') || false;
    const avoid = void_target ? (void_target as HTMLElement).dataset.avoidScroll : void_target;
    if (avoid) return;

    // this.isDragging = true;
    this.swipeDirection = false;

    this.touches.startX = target ? target.clientX : null;
    this.touches.startY = target ? target.clientY : null;
  }

  private touchEnd(event: MouseEvent | TouchEvent): void {
    if (!this.touches.startX || !this.touches.startY) return;

    const touchEvent = event as TouchEvent;
    const mouseEvent = event as MouseEvent;

    const target = 'changedTouches' in event ? touchEvent.changedTouches[0] : mouseEvent;

    this.touches.endX = target ? target.clientX : 0;
    this.touches.endY = target ? target.clientY : 0;

    const diferenceX = (this.touches.startX || 0) - (this.touches.endX || 0);
    const diferenceY = (this.touches.startY || 0) - (this.touches.endY || 0);

    if (Math.abs(diferenceX) > Math.abs(diferenceY)) {
      if ((window.innerWidth * 0.2) < Math.abs(diferenceX)) {
        this.swipeDirection = diferenceX > 0 ? 'right' : 'left';
      }
    } else {
      if ((window.innerHeight * 0.2) < Math.abs(diferenceY)) {
        this.swipeDirection = diferenceY > 0 ? 'down' : 'up';
      }
    }

    // this.isDragging = false;
    this.touches.startX = null;
    this.touches.startY = null;
    this.touches.endX = null;
    this.touches.endY = null;

    if (this.swipeDirection) {
      this.switchAndTranslate();
    }
    this.swipeDirection = false;
  }

  private swipeWithWheel(event: WheelEvent): void {
    const targetElement = event.target as Element;
    const void_target = targetElement.closest('[data-avoid-scroll]') || false;
    const avoid = void_target ? (void_target as HTMLElement).dataset.avoidScroll : void_target;
    if (avoid) return;

    if (event.deltaY > 0 && event.deltaX === 0) this.swipeDirection = 'down';
    if (event.deltaY < 0 && event.deltaX === 0) this.swipeDirection = 'up';
    if (event.deltaY === 0 && event.deltaX < 0) this.swipeDirection = 'left';
    if (event.deltaY === 0 && event.deltaX > 0) this.swipeDirection = 'right';

    if (this.swipeDirection) {
      this.switchAndTranslate();
    }
    this.swipeDirection = false;
  }

  private swipeWithKeyboard(event: KeyboardEvent): void {
    this.swipeDirection = false;
    if (event.keyCode === 37 || event.code === 'ArrowLeft') this.swipeDirection = 'left';
    if (event.keyCode === 38 || event.code === 'ArrowUp') this.swipeDirection = 'up';
    if (event.keyCode === 39 || event.code === 'ArrowRight') this.swipeDirection = 'right';
    if (event.keyCode === 40 || event.code === 'ArrowDown') this.swipeDirection = 'down';

    if (this.swipeDirection) {
      this.switchAndTranslate();
    }
    this.swipeDirection = false;
  }

  private gotoSection(event: Event = false as any): void {
    if (this.waitAnimation) return;
    this.swipeDirection = false;
    const data = {
      type: 'section',
      page: parseInt((event.target as HTMLInputElement).value, 10)
    };
    this.switchAndTranslate(data);
    return;
  }

  private gotoPage(event: Event = false as any): void {
    if (this.waitAnimation) return;
    this.swipeDirection = false;
    const data = {
      type: 'page',
      page: parseInt((event.target as HTMLInputElement).value, 10)
    };
    this.switchAndTranslate(data);
    return;
  }

  private navControls(navBtn: HTMLElement): void {
    if (this.waitAnimation) return;
    const value = navBtn.getAttribute('value');
    this.swipeDirection = value as SwipeDirection || false;
    this.switchAndTranslate();
    this.swipeDirection = false;
  }

  private navButton_manager(): void {
    if (this.pagesPerSection[this.currentSection].length === (this.currentPage[this.currentSection] + 1)) {
      const rightBtn = this.nav_btns.namedItem('nav-control-right');
      if (rightBtn) rightBtn.classList.add('disabled');
    } else {
      const rightBtn = this.nav_btns.namedItem('nav-control-right');
      if (rightBtn) rightBtn.classList.remove('disabled');
    }

    if (this.currentPage[this.currentSection] === 0) {
      const leftBtn = this.nav_btns.namedItem('nav-control-left');
      if (leftBtn) leftBtn.classList.add('disabled');
    } else {
      const leftBtn = this.nav_btns.namedItem('nav-control-left');
      if (leftBtn) leftBtn.classList.remove('disabled');
    }

    if (this.pagesPerSection.length === (this.currentSection + 1)) {
      const bottomBtn = this.nav_btns.namedItem('nav-control-bottom');
      if (bottomBtn) bottomBtn.classList.add('disabled');
    } else {
      const bottomBtn = this.nav_btns.namedItem('nav-control-bottom');
      if (bottomBtn) bottomBtn.classList.remove('disabled');
    }

    if (this.currentSection === 0) {
      const topBtn = this.nav_btns.namedItem('nav-control-top');
      if (topBtn) topBtn.classList.add('disabled');
    } else {
      const topBtn = this.nav_btns.namedItem('nav-control-top');
      if (topBtn) topBtn.classList.remove('disabled');
    }
  }
}

// Export the class for use in other modules
export default GallerySlider;