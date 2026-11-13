// Demo UI photography; not verified evidence of a submission.
const EDITOR_PHOTOS={
  park:[
    {src:'assets/gallery/vinwonders-phu-quoc.jpg',title:'Trò chơi tại VinWonders Phú Quốc'},
    {src:'assets/gallery/vinwonders-warrior-village.jpg',title:'Ngôi làng chiến binh · VinWonders Phú Quốc'},
    {src:'assets/gallery/vinwonders-castle.jpg',title:'Khu lâu đài · VinWonders Phú Quốc'},
    {src:'assets/gallery/vinwonders-once-show.jpg',title:'Once Show · VinWonders Phú Quốc'}
  ].map(p=>({...p,credit:'VinWonders',source:'https://vinwonders.com/vi/vinwonders-phu-quoc/'})),
  luxury:[
    {src:'assets/gallery/the-theodore-hanoi.jpg',title:'The Theodore Hanoi',credit:'The Theodore Hanoi / VnExpress',source:'https://vnexpress.net/ngam-ho-hoan-kiem-tu-khong-gian-luu-tru-hang-sang-5133934.html'},
    {src:'assets/gallery/hoiana-hotel-suites.jpg',title:'Hoiana Hotel & Suites',credit:'Hoiana Resort & Golf / VnExpress',source:'https://vnexpress.net/ky-nghi-da-trai-nghiem-ben-bo-bien-tai-hoiana-resort-golf-5131737.html'},
    {src:'assets/gallery/jw-marriott-cam-ranh.jpg',title:'JW Marriott Cam Ranh Bay Resort & Spa',credit:'JW Marriott Cam Ranh / VnExpress',source:'https://vnexpress.net/khong-gian-tiec-cuoi-lang-man-ben-bien-tai-jw-marriott-cam-ranh-5132767.html'},
    {src:'assets/gallery/radisson-blu-phu-quoc.png',title:'Radisson Blu Resort Phú Quốc',credit:'Radisson Blu Resort Phú Quốc / VnExpress',source:'https://vnexpress.net/mo-hinh-nghi-duong-ben-vung-cua-radisson-blu-resort-phu-quoc-5121935.html'}
  ]
};
const EDITOR_DEMO_EVIDENCE_FOLDER='https://drive.google.com/drive/u/0/folders/1w3oIEHL7Erx0Y7LUTMkI4q6a0fi8jV9C';
for(const category of AWARD_CATEGORIES){
  const photos=['tru-cot-3','tru-cot-4'].includes(category.id)?EDITOR_PHOTOS.luxury:EDITOR_PHOTOS.park;
  (PROFILES_BY_CATEGORY[category.id]||[]).forEach((profile,index)=>{
    const offset=(index+(category.id==='tru-cot-4'?2:0))%photos.length;
    profile.gallery=[...photos.slice(offset),...photos.slice(0,offset)].map(p=>({...p,alt:p.title}));
    // Shared folder supplied by the user for the demo. Production uses one URL per profile.
    profile.evidenceFolderUrl=profile.evidenceFolderUrl||EDITOR_DEMO_EVIDENCE_FOLDER;
  });
}
