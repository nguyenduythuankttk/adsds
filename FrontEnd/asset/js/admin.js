// Auth Guard
(function(){
    var r=localStorage.getItem('role');
    if(r!=='admin'){alert('No access!');window.location.href='./index.html';return;}
    var u=document.getElementById('adm-username');
    if(u)u.textContent=localStorage.getItem('fullName')||'Admin';
})();
var lb=document.getElementById('btn-logout');
if(lb)lb.addEventListener('click',function(){
    apiPost('/auth/logout').catch(function(){}).finally(function(){clearAuth();window.location.href='./index.html';});
});
setInterval(function(){var c=document.getElementById('adm-clock');if(c)c.textContent=new Date().toLocaleString('vi-VN');},1000);

// Cache
var STORES_DATA=[], PRODS_DATA=[], EMPS_DATA=[], SUPPS_DATA=[], TICKETS_DATA=[], BILLS_DATA=[], POS_DATA=[];
// Sections không có API – giữ mock
var INV=[
  {id:'B-001',item:'Thit dui ga',store:'Quan 1',sup:'Vissan',qty:120,unit:'Cai',cost:30000,in:'2026-05-10',exp:'2026-05-20',status:'ok'},
  {id:'B-002',item:'Syrup Pepsi',store:'Go Vap',sup:'PepsiCo',qty:5,unit:'Thung',cost:50000,in:'2026-01-10',exp:'2026-05-16',status:'expiring'},
  {id:'B-003',item:'Bot chien xu',store:'Quan 1',sup:'Tan Phat',qty:0,unit:'Kg',cost:20000,in:'2025-10-01',exp:'2026-04-01',status:'expired'}
];
var SDEFS=[{name:'Ca Sang',time:'06:00-14:00'},{name:'Ca Chieu',time:'14:00-22:00'},{name:'Ca Dem',time:'22:00-06:00'}];
var SHIFTS=[
  {emp:'Le Minh Phung',store:'Quan 1',shift:'Ca Sang',date:'2026-05-15',in:'05:55',out:'14:05',status:'ok'},
  {emp:'Pham Van D',store:'Da Nang',shift:'Ca Chieu',date:'2026-05-15',in:'--',out:'--',status:'pending'},
  {emp:'Nguyen Van A',store:'Quan 1',shift:'Ca Chieu',date:'2026-05-14',in:'14:20',out:'22:00',status:'late'}
];
var MOVS=[
  {item:'Thit dui ga',store:'Quan 1',type:'Nhap kho',qty:120,unit:'Cai',reason:'Nhap hang tuan',emp:'Nguyen Van A',date:'2026-05-10'},
  {item:'Dau an',store:'Go Vap',type:'Xuat hao hut',qty:2,unit:'Lit',reason:'Tran do tai nan',emp:'Tran Thi B',date:'2026-05-12'}
];

// Navigation
document.querySelectorAll('.sidebar-item[data-section]').forEach(function(it){
    it.addEventListener('click',function(){showSection(this.getAttribute('data-section'));});
});
function showSection(n){
    document.querySelectorAll('.adm-section').forEach(function(s){s.classList.remove('active');});
    document.querySelectorAll('.sidebar-item').forEach(function(s){s.classList.remove('active');});
    var sec=document.getElementById('section-'+n);if(sec)sec.classList.add('active');
    var nav=document.getElementById('nav-'+n);if(nav)nav.classList.add('active');
    var map={
        dashboard:renderDash, stores:renderStores, products:renderProds, recipes:renderRecipes,
        suppliers:renderSupps, 'purchase-orders':renderPO, inventory:renderInv,
        employees:renderEmps, shifts:renderShifts, tickets:renderTickets,
        reports:renderReports, 'stock-movement':renderMovs
    };
    if(map[n])map[n]();
}
// Helpers
function sc(ico,col,val,lbl){return '<div class="stat-card"><div class="stat-icon '+col+'"><i class="'+ico+'"></i></div><div class="stat-info"><div class="num">'+val+'</div><div class="lbl">'+lbl+'</div></div></div>';}
function fv(n){return Number(n).toLocaleString('vi-VN');}
function bdg(cls,txt){return '<span class="badge '+cls+'">'+txt+'</span>';}
function eBtn(cls,ico,cb){return '<button class="'+cls+'" onclick="'+cb+'"><i class="'+ico+'"></i></button>';}
function today(){return new Date().toISOString().slice(0,10);}
function yearRange(){return '2020-01-01/'+today();}

// ===== RENDER FUNCTIONS =====

function renderDash(){
    var d=document.getElementById('dash-stats');
    Promise.all([
        apiGet('/store/get-all').then(function(r){return r.ok?r.json():[];}),
        apiGet('/bill/get-all/'+yearRange()).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];})
    ]).then(function(res){
        var stores=res[0]||[], bills=res[1]||[];
        STORES_DATA=stores; BILLS_DATA=bills;
        var rev=bills.reduce(function(a,b){return a+(b.total||0);},0);
        if(d)d.innerHTML=sc('ti-money','orange',fv(rev)+' đ','Doanh thu')+sc('ti-receipt','blue',bills.length,'Tổng HĐ')+sc('ti-map','green',stores.length,'Cửa hàng');
        var bt=document.getElementById('dash-bill-tbody');
        if(bt)bt.innerHTML=bills.slice(0,4).map(function(b){return '<tr><td style="font-weight:700;color:var(--primary)">'+b.billID+'</td><td>'+(b.store?b.store.storeName:'')+'</td><td style="font-weight:600">'+fv(b.total)+' đ</td><td>'+bdg('badge-paid','Hoàn thành')+'</td></tr>';}).join('')||'<tr><td colspan="4" class="tbl-empty">Không có dữ liệu</td></tr>';
    });
    var et=document.getElementById('dash-exp-tbody');
    if(et)et.innerHTML=INV.filter(function(i){return i.status!=='ok';}).map(function(i){return '<tr><td>'+i.item+'</td><td>'+i.store+'</td><td style="color:var(--red)">'+i.exp+'</td><td>'+i.qty+' '+i.unit+'</td></tr>';}).join('');
}

function renderStores(){
    var c=document.getElementById('store-cards');if(!c)return;
    c.innerHTML='<div class="tbl-empty">Đang tải...</div>';
    apiGet('/store/get-all').then(function(r){return r.json();}).then(function(data){
        STORES_DATA=data||[];
        if(!STORES_DATA.length){c.innerHTML='<div class="tbl-empty">Chưa có cửa hàng nào</div>';return;}
        c.innerHTML=STORES_DATA.map(function(s){
            return '<div class="store-card"><div class="store-card-header"><div class="store-card-name">'+s.storeName+'</div>'+bdg('badge-active','Hoạt động')+'</div>'+
                   '<div class="store-card-body"><div><i class="ti-mobile"></i> '+s.phone+'</div><div><i class="ti-email"></i> '+s.email+'</div><div><i class="ti-layout-list-thumb-alt"></i> Sức chứa: <b>'+s.seatingCapacity+'</b></div></div>'+
                   '<div class="store-card-footer">'+eBtn('btn-edit','ti-pencil',"crudEdit('store','"+s.storeID+"')")+eBtn('btn-del','ti-trash',"crudDelete('store','"+s.storeID+"')")+'</div></div>';
        }).join('');
    }).catch(function(){c.innerHTML='<div class="tbl-empty">Lỗi tải dữ liệu</div>';});
}

function renderProds(){
    var pt=document.getElementById('product-tbody');if(!pt)return;
    pt.innerHTML='<tr><td colspan="6" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/product/get-all').then(function(r){return r.json();}).then(function(data){
        PRODS_DATA=data||[];
        if(!PRODS_DATA.length){pt.innerHTML='<tr><td colspan="6" class="tbl-empty">Chưa có sản phẩm</td></tr>';return;}
        pt.innerHTML=PRODS_DATA.map(function(p){
            var pv=p.productVarient&&p.productVarient.length?p.productVarient[0]:null;
            return '<tr><td>'+p.productID+'</td><td style="font-weight:600">'+p.productName+'</td><td>'+p.productType+'</td>'+
                   '<td style="font-weight:600;color:var(--primary)">'+(pv?fv(pv.price)+' đ':'—')+'</td>'+
                   '<td>'+bdg('badge-active','Đang bán')+'</td>'+
                   '<td>'+eBtn('btn-edit','ti-pencil',"crudEdit('product','"+p.productID+"')")+eBtn('btn-del','ti-trash',"crudDelete('product','"+p.productID+"')")+'</td></tr>';
        }).join('');
    }).catch(function(){pt.innerHTML='<tr><td colspan="6" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

function renderRecipes(){
    var t=document.getElementById('recipe-tbody');if(!t)return;
    t.innerHTML='<tr><td colspan="5" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/recipe/get-all').then(function(r){return r.json();}).then(function(data){
        if(!data||!data.length){t.innerHTML='<tr><td colspan="5" class="tbl-empty">Chưa có công thức</td></tr>';return;}
        t.innerHTML=data.map(function(r){
            return '<tr><td>'+(r.ingredientID||'')+'</td><td>'+(r.productVarientID||'')+'</td>'+
                   '<td style="font-weight:700">'+(r.qtyBeforeProcess||0)+'</td>'+
                   '<td>'+(r.qtyAfterProcess||0)+'</td>'+
                   '<td>'+eBtn('btn-del','ti-trash',"crudDelete('recipe','"+r.ingredientID+"/"+r.productVarientID+"')")+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="5" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

function renderSupps(){
    var t=document.getElementById('supplier-tbody');if(!t)return;
    t.innerHTML='<tr><td colspan="7" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/supplier/get-all').then(function(r){return r.json();}).then(function(data){
        SUPPS_DATA=data||[];
        if(!SUPPS_DATA.length){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Chưa có NCC</td></tr>';return;}
        t.innerHTML=SUPPS_DATA.map(function(s,i){
            return '<tr><td>'+(i+1)+'</td><td style="font-weight:700">'+(s.supplierName||'')+'</td>'+
                   '<td>'+s.phone+'</td><td>'+s.email+'</td><td>'+(s.taxCode||'')+'</td>'+
                   '<td>'+eBtn('btn-edit','ti-pencil',"crudEdit('supplier','"+s.supplierID+"')")+eBtn('btn-del','ti-trash',"crudDelete('supplier','"+s.supplierID+"')")+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

var poFilter='all';
function renderPO(){
    var t=document.getElementById('po-tbody');if(!t)return;
    t.innerHTML='<tr><td colspan="10" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/purchaseorder/Get-all/'+yearRange()).then(function(r){return r.ok?r.json():[];}).then(function(data){
        POS_DATA=data||[];
        var rows=poFilter==='all'?POS_DATA:POS_DATA.filter(function(p){return (p.pOStatus||p.status||'').toLowerCase()===poFilter;});
        var pc=POS_DATA.filter(function(p){var st=(p.pOStatus||p.status||'').toLowerCase();return st==='pending'||st==='waiting';}).length;
        var b=document.getElementById('badge-po');if(b){b.textContent=pc;b.style.display=pc>0?'inline-block':'none';}
        if(!rows.length){t.innerHTML='<tr><td colspan="10" class="tbl-empty">Không có đơn nào</td></tr>';return;}
        t.innerHTML=rows.map(function(p){
            var st=(p.pOStatus||p.status||'pending').toLowerCase();
            var cl=st==='approved'?'badge-approved':(st==='rejected'?'badge-rejected':'badge-pending');
            var tx=st==='approved'?'Đã duyệt':(st==='rejected'?'Từ chối':'Chờ duyệt');
            var ac=(st==='pending'||st==='waiting')?
                eBtn('btn-approve','ti-check',"actionPO('"+p.pOID+"','Approved')")+' '+eBtn('btn-reject','ti-close',"actionPO('"+p.pOID+"','Rejected')"):
                '<span style="color:#aaa;font-size:12px">Đã chốt</span>';
            return '<tr><td style="font-weight:700;color:var(--primary)">'+(p.pOID||'').toString().slice(0,8)+'</td>'+
                   '<td>'+(p.store?p.store.storeName:p.storeID)+'</td>'+
                   '<td style="font-weight:600">'+(p.supplier?p.supplier.supplierName:p.supplierID)+'</td>'+
                   '<td style="font-size:12px">'+(p.createdAt||'').toString().slice(0,10)+'</td>'+
                   '<td>'+bdg(cl,tx)+'</td><td>'+ac+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="10" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}
window.actionPO=function(id,status){
    var empId=localStorage.getItem('employeeId')||'00000000-0000-0000-0000-000000000000';
    apiPut('/purchaseorder/update/'+id,{EmployeeID:empId,POStatus:status,Comment:''})
        .then(function(r){
            if(r.ok){showToast((status==='Approved'?'Đã duyệt':'Đã từ chối')+' đơn','success');renderPO();}
            else{showToast('Thao tác thất bại','error');}
        }).catch(function(){showToast('Lỗi kết nối','error');});
};
document.querySelectorAll('#po-filter-tabs .ftab').forEach(function(b){
    b.addEventListener('click',function(){
        document.querySelectorAll('#po-filter-tabs .ftab').forEach(function(x){x.classList.remove('active');});
        this.classList.add('active');poFilter=this.getAttribute('data-filter');renderPO();
    });
});

var invFilter='all';
function renderInv(){
    var t=document.getElementById('inv-tbody'),s=document.getElementById('inv-stats');if(!t||!s)return;
    var rows=invFilter==='all'?INV:INV.filter(function(i){return i.status===invFilter;});
    s.innerHTML=sc('ti-package','blue',INV.length,'Lô Hàng')+sc('ti-timer','gold',INV.filter(function(i){return i.status==='expiring';}).length,'Sắp hết hạn')+sc('ti-alert','red',INV.filter(function(i){return i.status==='expired';}).length,'Đã hết hạn');
    t.innerHTML=rows.map(function(i){var cl=i.status==='ok'?'badge-ok':(i.status==='expiring'?'badge-expiring':'badge-expired');var tx=i.status==='ok'?'Bình thường':(i.status==='expiring'?'Sắp hết hạn':'Hết hạn');return '<tr><td style="font-weight:700;color:var(--primary)">'+i.id+'</td><td style="font-weight:600">'+i.item+'</td><td>'+i.store+'</td><td>'+i.sup+'</td><td style="font-weight:700">'+i.qty+'</td><td>'+i.unit+'</td><td>'+fv(i.cost)+' đ</td><td style="font-size:12px">'+i.in+'</td><td style="color:'+(i.status!=='ok'?'var(--red)':'inherit')+';font-weight:600">'+i.exp+'</td><td>'+bdg(cl,tx)+'</td></tr>';}).join('');
}
document.querySelectorAll('#section-inventory .filter-tabs .ftab').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#section-inventory .filter-tabs .ftab').forEach(function(x){x.classList.remove('active');});this.classList.add('active');invFilter=this.getAttribute('data-filter');renderInv();});});

function renderEmps(){
    var t=document.getElementById('emp-tbody');if(!t)return;
    t.innerHTML='<tr><td colspan="9" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/employee/get-all').then(function(r){return r.json();}).then(function(data){
        EMPS_DATA=data||[];
        if(!EMPS_DATA.length){t.innerHTML='<tr><td colspan="9" class="tbl-empty">Chưa có nhân viên</td></tr>';return;}
        t.innerHTML=EMPS_DATA.map(function(e,i){
            return '<tr><td>'+(i+1)+'</td><td style="font-weight:700">'+(e.fullName||e.employeeName||'')+'</td>'+
                   '<td>'+(e.role||'')+'</td><td>'+(e.store?e.store.storeName:e.storeID||'')+'</td>'+
                   '<td>'+(e.phone||'')+'</td><td style="font-size:12px">'+(e.email||'')+'</td>'+
                   '<td style="font-weight:700;color:var(--primary)">'+fv(e.basicSalary||0)+' đ</td>'+
                   '<td>'+bdg('badge-active','Đang làm')+'</td>'+
                   '<td>'+eBtn('btn-edit','ti-pencil',"crudEdit('emp','"+(e.userID||e.employeeID)+"')")+eBtn('btn-del','ti-trash',"crudDelete('emp','"+(e.userID||e.employeeID)+"')")+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="9" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

function renderShifts(){
    var dl=document.getElementById('shift-def-list'),t=document.getElementById('shift-tbody');if(!dl||!t)return;
    dl.innerHTML=SDEFS.map(function(d){return '<li class="shift-def-item"><div class="shift-name">'+d.name+'</div><div class="shift-time">'+d.time+'</div></li>';}).join('');
    t.innerHTML=SHIFTS.map(function(s){var cl=s.status==='ok'?'badge-ok':(s.status==='late'?'badge-expired':'badge-pending');var tx=s.status==='ok'?'Đúng giờ':(s.status==='late'?'Đi trễ':'Chưa check-in');return '<tr><td style="font-weight:600">'+s.emp+'</td><td>'+s.store+'</td><td>'+s.shift+'</td><td style="font-size:12px">'+s.date+'</td><td style="font-weight:700;color:var(--primary)">'+s.in+'</td><td style="font-weight:700">'+s.out+'</td><td>'+bdg(cl,tx)+'</td></tr>';}).join('');
}

function renderTickets(){
    var c=document.getElementById('ticket-cards'),t=document.getElementById('ticket-tbody');if(!c||!t)return;
    t.innerHTML='<tr><td colspan="7" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/ticket/get-all/'+yearRange()).then(function(r){return r.ok?r.json():[];}).then(function(data){
        TICKETS_DATA=data||[];
        var now=today();
        if(c)c.innerHTML=(TICKETS_DATA.slice(0,2)).map(function(tk){
            return '<div class="ticket-card"><div class="ticket-card-code">'+(tk.ticketID||'').toString().slice(0,8)+'</div>'+
                   '<div class="ticket-card-info"><span><i class="ti-gift"></i> Giảm '+fv(tk.discount*100)+'%</span><span><i class="ti-timer"></i> '+tk.endDate+'</span></div></div>';
        }).join('');
        if(!TICKETS_DATA.length){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Chưa có mã ưu đãi</td></tr>';return;}
        t.innerHTML=TICKETS_DATA.map(function(tk){
            var active=tk.endDate>=now&&!tk.deletedAt;
            return '<tr><td style="font-weight:800;color:var(--primary)">'+(tk.ticketID||'').toString().slice(0,8)+'</td>'+
                   '<td style="font-weight:700">'+fv(tk.discount*100)+'%</td>'+
                   '<td style="font-size:12px">'+(tk.startDate||'')+'</td>'+
                   '<td style="font-size:12px">'+(tk.endDate||'')+'</td>'+
                   '<td>'+bdg(active?'badge-active':'badge-expired',active?'Khả dụng':'Hết hạn')+'</td>'+
                   '<td>'+eBtn('btn-del','ti-trash',"crudDelete('ticket','"+(tk.ticketID)+"')")+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

function renderReports(){
    var s=document.getElementById('report-stats'),t=document.getElementById('bill-tbody');if(!s||!t)return;
    t.innerHTML='<tr><td colspan="6" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/bill/get-all/'+yearRange()).then(function(r){return r.ok?r.json():[];}).then(function(data){
        BILLS_DATA=data||[];
        var rev=BILLS_DATA.reduce(function(a,b){return a+(b.total||0);},0);
        if(s)s.innerHTML=sc('ti-stats-up','orange',fv(rev)+' đ','Tổng Doanh Thu')+sc('ti-receipt','blue',BILLS_DATA.length,'Tổng Hóa Đơn');
        if(!BILLS_DATA.length){t.innerHTML='<tr><td colspan="6" class="tbl-empty">Chưa có hóa đơn</td></tr>';return;}
        t.innerHTML=BILLS_DATA.map(function(b){
            return '<tr><td style="font-weight:700">'+(b.billID||'').toString().slice(0,8)+'</td>'+
                   '<td>'+(b.store?b.store.storeName:'')+'</td>'+
                   '<td style="font-weight:700;color:var(--primary)">'+fv(b.total||0)+' đ</td>'+
                   '<td>'+fv(b.moneyReceived||0)+' đ</td>'+
                   '<td>'+(b.paymentMethods||'')+'</td>'+
                   '<td>'+bdg('badge-paid','Hoàn tất')+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="6" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

function renderMovs(){
    var s=document.getElementById('sm-stats'),t=document.getElementById('sm-tbody');if(!s||!t)return;
    var inp=MOVS.filter(function(m){return m.type.indexOf('Nhap')>=0;}).length;
    if(s)s.innerHTML=sc('ti-arrow-down','green',inp,'Lần Nhập Kho')+sc('ti-arrow-up','red',MOVS.length-inp,'Lần Xuất Kho');
    t.innerHTML=MOVS.map(function(m){var cl=m.type.indexOf('Nhap')>=0?'badge-in':(m.type.indexOf('hao')>=0?'badge-adj':'badge-out');return '<tr><td style="font-weight:600">'+m.item+'</td><td>'+m.store+'</td><td>'+bdg(cl,m.type)+'</td><td style="font-weight:700">'+m.qty+'</td><td>'+m.unit+'</td><td style="font-size:12px;color:var(--muted)">'+m.reason+'</td><td>'+m.emp+'</td><td style="font-size:12px">'+m.date+'</td></tr>';}).join('');
}

// ===== TOAST =====
window.showToast=function(msg,type){
    var c=document.getElementById('toast-container');if(!c)return;
    var t=document.createElement('div');t.className='toast '+(type||'success');
    t.innerHTML='<i class="'+(type==='error'?'ti-close':type==='warning'?'ti-info-alt':'ti-check')+'"></i> '+msg;
    c.appendChild(t);
    setTimeout(function(){t.classList.add('hide');setTimeout(function(){t.remove();},300);},3000);
};

// ===== MODAL =====
var mOv=document.getElementById('modal-overlay');
function openModal(title,body,onConfirm){
    document.getElementById('modal-title').textContent=title;
    document.getElementById('modal-body').innerHTML=body;
    mOv.classList.add('open');
    var ok=document.getElementById('modal-confirm');
    ok.onclick=onConfirm||function(){closeModal();};
}
function closeModal(){mOv.classList.remove('open');}
['modal-close','modal-cancel'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('click',closeModal);});
if(mOv)mOv.addEventListener('click',function(e){if(e.target===this)closeModal();});

// ===== CRUD =====
var FORMS={
    store:'<div class="form-group"><label class="form-label">Tên chi nhánh</label><input id="f-name" class="form-control" placeholder="VD: Chônlibi Q1"></div>'+
          '<div class="form-group"><label class="form-label">Số điện thoại</label><input id="f-phone" class="form-control" placeholder="090x xxx xxx"></div>'+
          '<div class="form-group"><label class="form-label">Email</label><input id="f-email" type="email" class="form-control" placeholder="store@chonlibi.vn"></div>'+
          '<div class="form-group"><label class="form-label">Sức chứa</label><input id="f-capacity" type="number" class="form-control" placeholder="50"></div>',
    product:'<div class="form-group"><label class="form-label">Tên sản phẩm</label><input id="f-name" class="form-control" placeholder="VD: Đùi gà rán giòn"></div>'+
            '<div class="form-group"><label class="form-label">Loại</label><select id="f-type" class="form-control"><option value="Food">Food</option><option value="Drink">Drink</option><option value="Addon">Addon</option><option value="Combo">Combo</option></select></div>'+
            '<div class="form-group"><label class="form-label">Giá (VND)</label><input id="f-price" type="number" class="form-control" placeholder="35000"></div>',
    recipe:'<div class="form-group"><label class="form-label">ID Nguyên liệu</label><input id="f-ing" type="number" class="form-control" placeholder="1"></div>'+
           '<div class="form-group"><label class="form-label">ID Biến thể SP</label><input id="f-pv" type="number" class="form-control" placeholder="1"></div>'+
           '<div class="form-group"><label class="form-label">Định lượng trước chế biến</label><input id="f-qty1" type="number" class="form-control" placeholder="100"></div>'+
           '<div class="form-group"><label class="form-label">Định lượng sau chế biến</label><input id="f-qty2" type="number" class="form-control" placeholder="80"></div>',
    supplier:'<div class="form-group"><label class="form-label">Tên NCC</label><input id="f-name" class="form-control" placeholder="Tên nhà cung cấp"></div>'+
             '<div class="form-group"><label class="form-label">Số điện thoại</label><input id="f-phone" class="form-control" placeholder="090x xxx xxx"></div>'+
             '<div class="form-group"><label class="form-label">Email</label><input id="f-email" type="email" class="form-control" placeholder="email@ncc.vn"></div>'+
             '<div class="form-group"><label class="form-label">Mã số thuế</label><input id="f-tax" class="form-control" placeholder="0100000000"></div>',
    emp:'<div class="form-group"><label class="form-label">Họ tên</label><input id="f-name" class="form-control" placeholder="Họ tên nhân viên"></div>'+
        '<div class="form-group"><label class="form-label">Tên đăng nhập</label><input id="f-username" class="form-control" placeholder="username"></div>'+
        '<div class="form-group"><label class="form-label">Mật khẩu</label><input id="f-pass" type="password" class="form-control" placeholder="Tối thiểu 6 ký tự"></div>'+
        '<div class="form-group"><label class="form-label">Email</label><input id="f-email" type="email" class="form-control" placeholder="email@chonlibi.vn"></div>'+
        '<div class="form-group"><label class="form-label">Số điện thoại</label><input id="f-phone" class="form-control" placeholder="090x xxx xxx"></div>'+
        '<div class="form-group"><label class="form-label">Ngày sinh</label><input id="f-birth" type="date" class="form-control"></div>'+
        '<div class="form-group"><label class="form-label">Giới tính</label><select id="f-gender" class="form-control"><option value="Male">Nam</option><option value="Female">Nữ</option><option value="Other">Khác</option></select></div>'+
        '<div class="form-group"><label class="form-label">Vai trò</label><select id="f-role" class="form-control"><option value="Manager">Manager</option><option value="Counter">Counter</option></select></div>'+
        '<div class="form-group"><label class="form-label">ID Chi nhánh</label><input id="f-store" type="number" class="form-control" placeholder="1"></div>'+
        '<div class="form-group"><label class="form-label">Lương cơ bản</label><input id="f-salary" type="number" class="form-control" placeholder="5000000"></div>',
    ticket:'<div class="form-group"><label class="form-label">Ngày bắt đầu</label><input id="f-start" type="date" class="form-control"></div>'+
           '<div class="form-group"><label class="form-label">Ngày kết thúc</label><input id="f-end" type="date" class="form-control"></div>'+
           '<div class="form-group"><label class="form-label">Giảm giá (0-1, VD: 0.2 = 20%)</label><input id="f-disc" type="number" step="0.01" min="0" max="1" class="form-control" placeholder="0.20"></div>'+
           '<div class="form-group"><label class="form-label">Số lượng mã</label><input id="f-qty" type="number" class="form-control" placeholder="100"></div>'
};

function getV(id){var e=document.getElementById(id);return e?e.value.trim():'';}

function crudAdd(type){
    openModal('Thêm mới '+type, FORMS[type]||'', function(){
        var ok=false;
        if(type==='store'){
            apiPost('/store/add/0',{StoreName:getV('f-name'),Phone:getV('f-phone'),Email:getV('f-email'),SeatingCapacity:parseInt(getV('f-capacity'))||0,TotalReviews:0,TotalPoints:0})
            .then(function(r){if(r.ok){showToast('Thêm cửa hàng thành công','success');closeModal();renderStores();}else{showToast('Thêm thất bại','error');}});
        } else if(type==='product'){
            apiPost('/product/add-product',{ProductName:getV('f-name'),ProductType:getV('f-type'),Image:null})
            .then(function(r){
                if(r.ok){
                    // Sau khi add product, thêm variant mặc định với giá đã nhập
                    return apiGet('/product/get-all').then(function(r2){return r2.json();}).then(function(prods){
                        var last=prods[prods.length-1];
                        if(last&&getV('f-price')){
                            return apiPost('/product/add-varient',{ProductID:last.productID,Size:'Default',Price:parseFloat(getV('f-price'))||0});
                        }
                    }).then(function(){showToast('Thêm sản phẩm thành công','success');closeModal();renderProds();});
                } else {showToast('Thêm thất bại','error');}
            });
        } else if(type==='supplier'){
            apiPost('/supplier/create',{SupplierName:getV('f-name'),Phone:getV('f-phone'),Email:getV('f-email'),TaxCode:getV('f-tax')})
            .then(function(r){if(r.ok){showToast('Thêm NCC thành công','success');closeModal();renderSupps();}else{showToast('Thêm thất bại','error');}});
        } else if(type==='recipe'){
            apiPost('/recipe/add',{IngredientID:parseInt(getV('f-ing')),ProductVarientID:parseInt(getV('f-pv')),QtyBeforeProcess:parseFloat(getV('f-qty1'))||0,QtyAfterProcess:parseFloat(getV('f-qty2'))||0})
            .then(function(r){if(r.ok){showToast('Thêm công thức thành công','success');closeModal();renderRecipes();}else{showToast('Thêm thất bại','error');}});
        } else if(type==='emp'){
            apiPost('/employee/add',{UserName:getV('f-username'),HashPassword:getV('f-pass'),FullName:getV('f-name'),BirthDate:getV('f-birth')||'2000-01-01',Phone:getV('f-phone'),Email:getV('f-email'),Gender:getV('f-gender'),Role:getV('f-role'),StoreID:parseInt(getV('f-store'))||1,BasicSalary:parseFloat(getV('f-salary'))||0})
            .then(function(r){if(r.ok){showToast('Thêm nhân viên thành công','success');closeModal();renderEmps();}else{r.json().then(function(d){showToast(d.message||'Thêm thất bại','error');});}});
        } else if(type==='ticket'){
            apiPost('/ticket/create',{StartDate:getV('f-start'),EndDate:getV('f-end'),Discount:parseFloat(getV('f-disc'))||0,Qty:parseInt(getV('f-qty'))||1})
            .then(function(r){if(r.ok){showToast('Tạo mã ưu đãi thành công','success');closeModal();renderTickets();}else{showToast('Tạo thất bại','error');}});
        } else {
            showToast('Chưa hỗ trợ thêm mới '+type,'warning');closeModal();
        }
    });
}

window.crudEdit=function(type,id){
    openModal('Chỉnh sửa '+type, FORMS[type]||'', function(){
        if(type==='store'){
            apiPut('/store/update/'+id,{StoreName:getV('f-name'),Phone:getV('f-phone'),Email:getV('f-email'),SeatingCapacity:parseInt(getV('f-capacity'))||0})
            .then(function(r){if(r.ok){showToast('Cập nhật thành công','success');closeModal();renderStores();}else{showToast('Cập nhật thất bại','error');}});
        } else if(type==='product'){
            apiPut('/product/update-product/'+id,{ProductName:getV('f-name'),Image:null})
            .then(function(r){if(r.ok){showToast('Cập nhật thành công','success');closeModal();renderProds();}else{showToast('Cập nhật thất bại','error');}});
        } else if(type==='supplier'){
            apiPut('/supplier/update/'+id,{SupplierName:getV('f-name'),Phone:getV('f-phone'),Email:getV('f-email'),TaxCode:getV('f-tax')})
            .then(function(r){if(r.ok){showToast('Cập nhật thành công','success');closeModal();renderSupps();}else{showToast('Cập nhật thất bại','error');}});
        } else if(type==='emp'){
            apiPut('/employee/Update/'+id,{FullName:getV('f-name')||undefined,Phone:getV('f-phone')||undefined,Email:getV('f-email')||undefined})
            .then(function(r){if(r.ok){showToast('Cập nhật thành công','success');closeModal();renderEmps();}else{showToast('Cập nhật thất bại','error');}});
        } else {
            showToast('Đã lưu (chưa kết nối API cho '+type+')','warning');closeModal();
        }
    });
};

window.crudDelete=function(type,id){
    if(!confirm('Bạn có chắc muốn xóa?'))return;
    var path='';
    if(type==='store')    path='/store/softdelete/'+id;
    else if(type==='product') path='/product/soft-delete/'+id;
    else if(type==='supplier') path='/supplier/soft-delete/'+id;
    else if(type==='emp')  path='/employee/Delete/'+id;
    else if(type==='ticket') path='/ticket/Delete/'+id;
    else if(type==='recipe'){
        var parts=id.split('/');
        path='/recipe/Delete/'+parts[0]+'/'+parts[1];
    }

    if(!path){showToast('Chưa hỗ trợ xóa '+type,'warning');return;}
    apiDelete(path).then(function(r){
        if(r.ok){showToast('Đã xóa thành công','success');showSection(document.querySelector('.adm-section.active').id.replace('section-',''));}
        else{showToast('Xóa thất bại','error');}
    }).catch(function(){showToast('Lỗi kết nối','error');});
};

// Wire up Add buttons
var addBtns={'btn-add-store':'store','btn-add-product':'product','btn-add-recipe':'recipe','btn-add-supplier':'supplier','btn-add-emp':'emp','btn-add-ticket':'ticket'};
Object.keys(addBtns).forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.addEventListener('click',function(){crudAdd(addBtns[id]);});
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded',function(){showSection('dashboard');});
