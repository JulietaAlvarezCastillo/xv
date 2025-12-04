import './style.css'
import GallerySlider from './gallery/gallerySlider'
import Atropos from 'atropos';
import { isMobile } from 'mobile-device-detect';

document.addEventListener('sectionTanslate', function(event:Event) {
  const customEvent = event as CustomEvent;
  console.log('Custom event received:', customEvent.type);
  console.log('Event details:', customEvent.detail);
  console.log('scroll:', customEvent.detail.scroll);
  console.log('index:', customEvent.detail.index);
});
window.addEventListener('DOMContentLoaded', () => {
  new GallerySlider({});
  const artroposConfig = {
    rotateTouch:true,
    shadow:false,
    highlight:false,
    rotateXMax:5,
    rotateYMax:5,
  }
  Atropos({
    el: '#cover',
    ...artroposConfig,
  });
  Atropos({
    el: '#middle',
    ...artroposConfig,
  });
  Atropos({
    el: '#bottom',
    ...artroposConfig,
  });

  document.getElementById('shareLocation')?.addEventListener('click',()=>{
    const mapsLocation = "https://maps.app.goo.gl/xnf1ZZuzJovySzFK6";
    window.open(mapsLocation, '_blank');
  })
  document.getElementById('shareWhatsapp')?.addEventListener('click',()=>{
    const mapsLocation = "https://maps.app.goo.gl/xnf1ZZuzJovySzFK6";
    let whatsappUrl = "https://web.whatsapp.com/send?text=" + mapsLocation;
    if(isMobile){
      whatsappUrl = "whatsapp://send?text=" + mapsLocation;
    }
    return window.open(whatsappUrl, '_blank');
  })
})