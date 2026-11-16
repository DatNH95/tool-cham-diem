"""Read the HTML-table .xls export; emit application data, never edit the source file."""
from html.parser import HTMLParser
from html import unescape
from pathlib import Path
from urllib.parse import urlsplit
from collections import Counter
import json, re, sys, hashlib

ROOT=Path(__file__).resolve().parent.parent
CATEGORIES={
 'Điểm đến du lịch của năm':'tru-cot-1','Doanh nghiệp lữ hành của năm':'tru-cot-2',
 'Khách sạn của năm':'tru-cot-3','Khu nghỉ dưỡng của năm (Resort)':'tru-cot-4',
 'Hãng hàng không du lịch của năm':'tru-cot-5','Trải nghiệm du lịch của năm':'tru-cot-6',
 'Nhân vật du lịch của năm':'tien-phong-1','Sáng kiến du lịch bền vững của năm':'tien-phong-2',
 'Điểm đến du lịch xanh của năm':'tien-phong-3','Sản phẩm du lịch sáng tạo của năm':'tien-phong-4',
 'Chuyển đổi số xuất sắc trong du lịch':'tien-phong-5','Làng du lịch cộng đồng tiêu biểu của năm':'tien-phong-6',
 'Trải nghiệm ẩm thực du lịch của năm':'tien-phong-7','Gương mặt truyền thông du lịch của năm (Đại sứ)':'tien-phong-8',
 'Chiến dịch quảng bá du lịch của năm':'tien-phong-9'}

def clean(value):
    value=value.strip()
    for _ in range(4):
        decoded=unescape(value)
        if decoded==value:break
        value=decoded
    value=value.replace('\xa0',' ')
    return '' if value in ('','-') else value

def url(value):
    value=re.sub(r'\?;+','?',clean(value))
    return value if re.match(r'^https?://[^\s<>"\x00-\x1f]+$',value,re.I) else ''

class ExportParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.rows=[];self.row=None;self.cell=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='tr':self.row=[]
        elif tag in ('td','th') and self.row is not None:self.cell={'parts':[],'links':[],'images':[]}
        elif self.cell is not None:
            if tag in ('br','p','li','div'):self.cell['parts'].append('\n')
            if tag=='a' and attrs.get('href'):self.cell['links'].append(attrs['href'])
            if tag=='img' and attrs.get('src'):self.cell['images'].append(attrs['src'])
    def handle_data(self,data):
        if self.cell is not None:self.cell['parts'].append(data)
    def handle_endtag(self,tag):
        if tag in ('td','th') and self.cell is not None:
            self.cell['text']=clean(re.sub(r'\n\s*\n+','\n',re.sub(r'[ \t\r\f\v]+',' ',''.join(self.cell.pop('parts')))).strip())
            self.row.append(self.cell);self.cell=None
        elif tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None
        elif tag in ('p','li','div') and self.cell is not None:self.cell['parts'].append('\n')

def links(cell):
    candidates=cell['links']+cell['images']+re.findall(r'https?://[^\s<>]+',cell['text'])
    return list(dict.fromkeys(u for item in candidates if (u:=url(item))))

def main():
    source=Path(sys.argv[1]);raw=source.read_bytes();parser=ExportParser();parser.feed(raw.decode('utf-8-sig'))
    headers=[c['text'] for c in parser.rows[0]]
    if len(headers)!=69 or headers[1]!='Mã hồ sơ' or headers[51]!='Link thư mục Google Drive / Cloud hồ sơ tổng':raise ValueError('Unexpected export columns')
    schema=json.loads((ROOT/'data/registration-field-labels.json').read_text(encoding='utf-8'))
    profiles=[];downloads=[];seen=set();missing=[];non_drive=[]
    for rowno,row in enumerate(parser.rows[1:],2):
        if len(row)!=len(headers):raise ValueError(f'Column mismatch at row {rowno}')
        value=lambda i:row[i]['text']
        number=value(1);category=value(3)
        if not number.isdigit() or number in seen or category not in CATEGORIES or not value(4):raise ValueError(f'Invalid identity/category at row {rowno}')
        seen.add(number);fields=schema[category]
        if any(value(i) for i in range(28+len(fields['fields']),34)) or any(value(i) for i in range(34+len(fields['narratives']),39)):raise ValueError(f'Unmapped professional field at row {rowno}')
        operations=[{'title':label,'content':value(28+i)} for i,label in enumerate(fields['fields']) if value(28+i)]
        narratives=[{'title':label,'content':value(34+i)} for i,label in enumerate(fields['narratives']) if value(34+i)]
        folder=next(iter(links(row[51])),'')
        if not folder:missing.append(number)
        elif urlsplit(folder).hostname not in ('drive.google.com','docs.google.com'):non_drive.append(number)
        attachments=[]
        for col in range(54,66):
            label=(f'Minh chứng tiêu chí {col-57}' if 58<=col<=62 else headers[col])
            attachments.extend({'title':label,'url':u} for u in links(row[col]))
        gallery=[]
        for n,remote in enumerate(links(row[53]),1):
            suffix=Path(urlsplit(remote).path).suffix.lower()
            if suffix not in ('.jpg','.jpeg','.png','.webp'):continue
            local=f'assets/registration/{number}-{n:02d}{suffix}'
            downloads.append({'url':remote,'file':local})
            gallery.append({'src':local,'alt':f'{value(4)} — Ảnh {n}','title':f'Ảnh {n}','source':remote})
        profiles.append({'id':f'submission-{number}','code':f'HS-{number}','sourceId':number,'sourceRow':rowno,
          'categoryId':CATEGORIES[category],'categoryName':category,'dataSource':'registration-20261116',
          'title':value(4),'organization':value(14),'registerRole':value(15),'location':value(17),'country':value(18),
          'website':value(19),'fanpage':value(20),'representative':value(21),'summary':value(25),
          'achievements':value(26),'differentiation':value(27),'keyMetrics':[],'operationalData':operations,
          'criterionNarratives':narratives,'highlights':[],'gallery':gallery,'evidenceFolderUrl':folder,'attachments':attachments,
          'registrationStatus':value(9),'registrationRound':value(8),'registeredAt':value(13)})
    counts=dict(Counter(p['categoryName'] for p in profiles))
    payload={'source':{'filename':source.name,'sha256':hashlib.sha256(raw).hexdigest(),'snapshotDate':'2026-11-16','count':len(profiles),'counts':counts},'profiles':profiles}
    data=json.dumps(payload,ensure_ascii=False,indent=2).replace('<','\\u003c').replace('>','\\u003e').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
    loader='''\n// Real registrations replace demo fixtures. Stable IDs keep demo ballots separate.\nfor(const category of AWARD_CATEGORIES){\n  PROFILES_BY_CATEGORY[category.id]=REGISTRATION_DATA.profiles.filter(p=>p.categoryId===category.id);\n}\nconst currentRegistrations=PROFILES_BY_CATEGORY[appState.selectedCategoryId]||[];\nif(!currentRegistrations.some(p=>p.id===appState.selectedProfileId))appState.selectedProfileId=currentRegistrations[0]?.id||null;\n'''
    (ROOT/'shared/registration-data.js').write_text('// Imported from the user-provided export; personal contact/account columns excluded.\nconst REGISTRATION_DATA = '+data+';\n'+loader,encoding='utf-8')
    (ROOT/'tmp/registration-downloads.json').write_text(json.dumps(downloads,ensure_ascii=False,indent=2),encoding='utf-8')
    report={'source':source.name,'count':len(profiles),'categories':counts,'photos':len(downloads),'folderLinks':len(profiles)-len(missing),'withoutFolder':missing,'nonDriveLink':non_drive,'sourceStatuses':dict(Counter(p['registrationStatus'] for p in profiles))}
    (ROOT/'docs/registration-import.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
