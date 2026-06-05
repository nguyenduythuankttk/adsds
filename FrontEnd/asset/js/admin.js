// Auth Guard
(function(){
    var r=localStorage.getItem('role');
    if(r!=='admin'){alert('No access!');window.location.href='index.html';return;}
    if(isTokenExpired()){clearAuth();window.location.href='index.html';return;}
    var u=document.getElementById('adm-username');
    if(u)u.textContent=localStorage.getItem('fullName')||'Admin';
    // Hiện toast trạng thái ca khi vừa đăng nhập (chỉ 1 lần / phiên).
    try{
        var raw=localStorage.getItem('shiftStatus');
        if(raw && !sessionStorage.getItem('shiftToastShown')){
            var s=JSON.parse(raw);
            sessionStorage.setItem('shiftToastShown','1');
            setTimeout(function(){
                if(typeof showToast!=='function')return;
                if(!s.hasShift){showToast(s.message||'Hôm nay không có ca làm','warning');return;}
                var ty=s.status==='OnTime'?'success':(s.status==='Late'?'warning':(s.status==='Absent'?'error':'success'));
                showToast(s.message||('Ca: '+s.status), ty);
            },400);
        }
    }catch(e){}
})();
var lb=document.getElementById('btn-logout');
if(lb)lb.addEventListener('click',function(){
    apiPost('/auth/logout').catch(function(){}).finally(function(){clearAuth();window.location.href='index.html';});
});
setInterval(function(){var c=document.getElementById('adm-clock');if(c)c.textContent=fmtVnFull(new Date());},1000);
setInterval(function(){if(isTokenExpired()){clearAuth();window.location.href='index.html';}},60000);

// Cache
var STORES_DATA=[], PRODS_DATA=[], EMPS_DATA=[], SUPPS_DATA=[], TICKETS_DATA=[], BILLS_DATA=[], POS_DATA=[];
var WAREHOUSES_DATA=[], BATCHES_DATA=[];
var RECEIPTS_DATA=[], SHIFTS_DATA=[], INGREDIENTS_DATA=[];
var invStatusFilter='all', invTypeFilter='all', invWhFilter='all', invIngSearch='';
// Phạm vi hoạt động của admin: chỉ trong storeID của tài khoản hiện tại.
var ADMIN_STORE_ID = parseInt(localStorage.getItem('storeId')) || 0;
// Định nghĩa ca chuẩn — chọn 1 ca + chọn ngày sẽ ra TimeIn/TimeOut.
var SDEFS=[
    {key:'morning', name:'Ca Sáng',  start:'06:00', end:'14:00'},
    {key:'evening', name:'Ca Chiều', start:'14:00', end:'22:00'},
    {key:'night',   name:'Ca Đêm',   start:'22:00', end:'06:00'}
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
        receipts:renderReceipts,
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
function today(){return vnTodayISO();}
function yearRange(){return '2020-01-01/'+today();}
function ticketDefaultStart(){return today();}
function ticketDefaultEnd(){var d=new Date(today()+'T00:00:00+07:00');d.setUTCDate(d.getUTCDate()+7);return d.toISOString().slice(0,10);}
function applyTicketFilter(){renderTickets();}

// ===== RENDER FUNCTIONS =====

function renderDash(){
    var d=document.getElementById('dash-stats');
    Promise.all([
        apiGet('/store/get-all').then(function(r){return r.ok?r.json():[];}),
        apiGet('/bill/get-all/'+yearRange(), true).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];})
    ]).then(function(res){
        var stores=res[0]||[], bills=res[1]||[];
        STORES_DATA=stores; BILLS_DATA=bills;
        var rev=bills.reduce(function(a,b){return a+(b.total||0);},0);
        if(d)d.innerHTML=sc('ti-money','orange',fv(rev)+' đ','Doanh thu')+sc('ti-receipt','blue',bills.length,'Tổng HĐ')+sc('ti-map','green',stores.length,'Cửa hàng');
        var bt=document.getElementById('dash-bill-tbody');
        if(bt)bt.innerHTML=bills.slice(0,4).map(function(b){return '<tr><td style="font-weight:700;color:var(--primary)">'+b.billID+'</td><td>'+(b.store?b.store.storeName:'')+'</td><td style="font-weight:600">'+fv(b.total)+' đ</td><td>'+bdg('badge-paid','Hoàn thành')+'</td></tr>';}).join('')||'<tr><td colspan="4" class="tbl-empty">Không có dữ liệu</td></tr>';
    });
    var et=document.getElementById('dash-exp-tbody');
    if(et){apiGet('/inventorybatch/available-raw').then(function(r){return r.ok?r.json():[];}).then(function(batches){var now=new Date();var exp7=batches.filter(function(b){var d=new Date(b.exp);return (d-now)/86400000<=7&&(d-now)>=0;});et.innerHTML=exp7.slice(0,5).map(function(b){return '<tr><td style="font-weight:600">'+(b.ingredient?b.ingredient.ingredientName:'#'+b.ingredientID)+'</td><td>'+(b.warehouse&&b.warehouse.store?b.warehouse.store.storeName:'')+'</td><td style="color:var(--red);font-weight:700">'+b.exp+'</td><td style="font-weight:700">'+fv(b.quantityOnHand)+' '+(b.ingredient?b.ingredient.ingredientUnit:'')+'</td></tr>';}).join('')||'<tr><td colspan="4" class="tbl-empty">Không có lô nào sắp hết hạn</td></tr>';}).catch(function(){et.innerHTML='<tr><td colspan="4" class="tbl-empty">—</td></tr>';});}
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
            var prodName=(r.productVarient&&r.productVarient.product)?r.productVarient.product.productName:'#'+r.productVarientID;
            var size=(r.productVarient&&r.productVarient.size&&r.productVarient.size!=='Default')?(' ('+r.productVarient.size+')'):'';
            var ingName=(r.ingredient)?r.ingredient.ingredientName:'#'+r.ingredientID;
            var unit=(r.ingredient)?r.ingredient.ingredientUnit:'';
            return '<tr><td style="font-weight:600">'+prodName+size+'</td>'+
                   '<td>'+ingName+'</td>'+
                   '<td style="font-weight:700">'+(r.qtyBeforeProcess||0)+' → '+(r.qtyAfterProcess||0)+'</td>'+
                   '<td>'+unit+'</td>'+
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

// ===== KHO & LÔ HÀNG =====
function isBatchExpiring(b){if(!b.exp)return false;var d=new Date(b.exp),now=new Date();var diff=(d-now)/86400000;return diff>=0&&diff<=7;}
function batchDS(b){if(b.status==='Available'&&isBatchExpiring(b))return 'expiring';return b.status;}

function renderInv(){
    var wt=document.getElementById('warehouse-tbody'),it=document.getElementById('inv-tbody');
    if(!it)return;
    if(!ADMIN_STORE_ID){
        if(wt)wt.innerHTML='<tr><td colspan="6" class="tbl-empty">Tài khoản admin chưa được gán cửa hàng.</td></tr>';
        it.innerHTML='<tr><td colspan="12" class="tbl-empty">Không xác định được storeID của admin.</td></tr>';
        return;
    }
    if(wt)wt.innerHTML='<tr><td colspan="6" class="tbl-empty">Đang tải...</td></tr>';
    it.innerHTML='<tr><td colspan="12" class="tbl-empty">Đang tải...</td></tr>';
    Promise.all([
        apiGet('/warehouse/get-by-store/'+ADMIN_STORE_ID).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];}),
        apiGet('/inventorybatch/by-store/'+ADMIN_STORE_ID).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];})
    ]).then(function(res){
        WAREHOUSES_DATA=res[0]||[];
        // BE trả về DTO phẳng cho by-store: đã có ingredient/store info, BatchType/Status là chuỗi.
        BATCHES_DATA=(res[1]||[]).map(function(b){
            return {
                batchID:b.batchID, batchCode:b.batchCode,
                warehouseID:b.warehouseID,
                ingredientID:b.ingredientID,
                ingredient:{ingredientName:b.ingredientName, ingredientUnit:b.ingredientUnit},
                warehouse:{store:{storeName:b.storeName}},
                batchType:b.batchType, status:b.status,
                quantityOriginal:b.quantityOriginal, quantityOnHand:b.quantityOnHand,
                unitCost:b.unitCost, importDate:b.importDate,
                mfd:b.mfd, exp:b.exp
            };
        }).sort(function(a,b){return new Date(a.importDate)-new Date(b.importDate);});
        var whSel=document.getElementById('inv-wh-filter');
        if(whSel){whSel.innerHTML='<option value="all">Tất cả kho</option>'+WAREHOUSES_DATA.map(function(wh){return '<option value="'+wh.warehouseID+'">Kho #'+wh.warehouseID+' — '+(wh.store?wh.store.storeName:'')+'</option>';}).join('');}
        renderInvStats();renderWhTable();renderIngSummary();renderBatchTable();
    }).catch(function(){
        if(wt)wt.innerHTML='<tr><td colspan="6" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';
        it.innerHTML='<tr><td colspan="12" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';
    });
}

function renderInvStats(){
    var s=document.getElementById('inv-stats');if(!s)return;
    var total=BATCHES_DATA.length;
    var avail=BATCHES_DATA.filter(function(b){return b.status==='Available'&&b.quantityOnHand>0;}).length;
    var exp7=BATCHES_DATA.filter(function(b){return b.status==='Available'&&isBatchExpiring(b);}).length;
    var expired=BATCHES_DATA.filter(function(b){return b.status==='Expired';}).length;
    var val=BATCHES_DATA.reduce(function(acc,b){return acc+(b.quantityOnHand*b.unitCost);},0);
    s.innerHTML=sc('ti-layers','blue',total,'Tổng Lô Hàng')+sc('ti-check','green',avail,'Còn Hàng')+sc('ti-timer','gold',exp7,'Sắp Hết Hạn')+sc('ti-alert','red',expired,'Đã Hết Hạn')+sc('ti-money','orange',fv(val)+' đ','Giá Trị Tồn Kho');
}

function renderWhTable(){
    var t=document.getElementById('warehouse-tbody');if(!t)return;
    if(!WAREHOUSES_DATA.length){t.innerHTML='<tr><td colspan="6" class="tbl-empty">Chưa có kho nào</td></tr>';return;}
    t.innerHTML=WAREHOUSES_DATA.map(function(wh){
        var wbs=BATCHES_DATA.filter(function(b){return b.warehouseID===wh.warehouseID;});
        var tq=wbs.reduce(function(acc,b){return acc+b.quantityOnHand;},0);
        var pct=wh.capacity>0?Math.min(100,Math.round(tq/wh.capacity*100)):0;
        var bc=pct>80?'var(--red)':pct>50?'var(--gold)':'var(--green)';
        return '<tr>'+
            '<td style="font-weight:700;color:var(--primary)">#'+wh.warehouseID+'</td>'+
            '<td style="font-weight:600">'+(wh.store?wh.store.storeName:'N/A')+'</td>'+
            '<td>'+fv(wh.capacity)+'</td>'+
            '<td><div style="display:flex;align-items:center;gap:8px;min-width:160px"><div style="flex:1;background:#f0f0f0;border-radius:4px;height:7px"><div style="width:'+pct+'%;height:100%;background:'+bc+';border-radius:4px;transition:.3s"></div></div><span style="font-size:11px;color:var(--muted);white-space:nowrap">'+fv(tq)+' / '+fv(wh.capacity)+'</span></div></td>'+
            '<td><span style="font-weight:700">'+wbs.length+'</span> lô</td>'+
            '<td>'+eBtn('btn-edit','ti-pencil',"crudEdit('warehouse','"+wh.warehouseID+"')")+' '+eBtn('btn-del','ti-trash',"crudDelete('warehouse','"+wh.warehouseID+"')")+'</td>'+
        '</tr>';
    }).join('');
}

function renderIngSummary(){
    var t=document.getElementById('ing-summary-tbody');if(!t)return;
    var ingMap={};
    BATCHES_DATA.forEach(function(b){
        if(!b.ingredient)return;
        var k=b.ingredientID;
        if(!ingMap[k])ingMap[k]={name:b.ingredient.ingredientName,unit:b.ingredient.ingredientUnit,qty:0,cnt:0,expCnt:0};
        if(b.status==='Available'&&b.quantityOnHand>0){ingMap[k].qty+=b.quantityOnHand;ingMap[k].cnt++;if(isBatchExpiring(b))ingMap[k].expCnt++;}
    });
    var keys=Object.keys(ingMap);
    if(!keys.length){t.innerHTML='<tr><td colspan="5" class="tbl-empty">Không có nguyên liệu nào trong kho</td></tr>';return;}
    t.innerHTML=keys.sort(function(a,b){return ingMap[b].qty-ingMap[a].qty;}).map(function(k){
        var ig=ingMap[k];
        var expHtml=ig.expCnt>0?bdg('badge-expiring',ig.expCnt+' sắp hết hạn'):'<span style="color:var(--muted)">—</span>';
        return '<tr>'+
            '<td style="font-weight:700">'+ig.name+'</td>'+
            '<td style="color:var(--muted)">'+ig.unit+'</td>'+
            '<td style="font-weight:800;font-size:17px;color:var(--primary)">'+fv(ig.qty)+'</td>'+
            '<td>'+bdg('badge-ok',ig.cnt+' lô')+'</td>'+
            '<td>'+expHtml+'</td>'+
        '</tr>';
    }).join('');
}

function renderBatchTable(){
    var t=document.getElementById('inv-tbody'),info=document.getElementById('inv-count-info');if(!t)return;
    var rows=BATCHES_DATA.filter(function(b){
        if(invStatusFilter!=='all'&&batchDS(b)!==invStatusFilter)return false;
        if(invTypeFilter!=='all'&&b.batchType!==invTypeFilter)return false;
        if(invWhFilter!=='all'&&String(b.warehouseID)!==String(invWhFilter))return false;
        if(invIngSearch){var n=(b.ingredient?b.ingredient.ingredientName:'').toLowerCase(),c=(b.batchCode||'').toLowerCase();if(n.indexOf(invIngSearch)<0&&c.indexOf(invIngSearch)<0)return false;}
        return true;
    });
    if(info)info.textContent='Hiển thị '+rows.length+' / '+BATCHES_DATA.length+' lô · Sắp xếp FIFO (Ngày Nhập ↑)';
    if(!rows.length){t.innerHTML='<tr><td colspan="12" class="tbl-empty">Không có lô hàng phù hợp</td></tr>';return;}
    t.innerHTML=rows.map(function(b,i){
        var ds=batchDS(b),sCls,sTx;
        if(ds==='Available'){sCls='badge-ok';sTx='Còn Hàng';}
        else if(ds==='expiring'){sCls='badge-expiring';sTx='Sắp Hết Hạn';}
        else if(ds==='Expired'){sCls='badge-expired';sTx='Hết Hạn';}
        else if(ds==='Depleted'){sCls='badge-inactive';sTx='Hết Hàng';}
        else if(ds==='Damaged'){sCls='badge-rejected';sTx='Hỏng';}
        else if(ds==='Locked'){sCls='badge-pending';sTx='Khóa';}
        else{sCls='badge-inactive';sTx=ds;}
        var typeBdg=b.batchType==='Raw'?'<span class="badge" style="background:var(--blue-l);color:var(--blue)">Thô</span>':'<span class="badge" style="background:var(--primary-l);color:var(--primary)">Sơ Chế</span>';
        var qp=b.quantityOriginal>0?Math.round(b.quantityOnHand/b.quantityOriginal*100):0;
        var qc=qp<20?'var(--red)':qp<50?'var(--gold)':'var(--green)';
        var expSt=(ds==='Expired'||ds==='expiring')?'color:var(--red);font-weight:700':'';
        var ingName=b.ingredient?b.ingredient.ingredientName:'#'+b.ingredientID;
        var ingUnit=b.ingredient?b.ingredient.ingredientUnit:'';
        var storeName=b.warehouse&&b.warehouse.store?b.warehouse.store.storeName:'';
        return '<tr>'+
            '<td style="color:var(--muted);font-size:11px">'+(i+1)+'</td>'+
            '<td style="font-weight:700;color:var(--primary);font-size:12px;font-family:monospace">'+(b.batchCode||b.batchID.toString().slice(0,8).toUpperCase())+'</td>'+
            '<td><div style="font-weight:600">'+ingName+'</div><div style="font-size:11px;color:var(--muted)">'+ingUnit+'</div></td>'+
            '<td>'+typeBdg+'</td>'+
            '<td style="font-size:12px"><div>Kho #'+b.warehouseID+'</div><div style="color:var(--muted)">'+storeName+'</div></td>'+
            '<td style="color:var(--muted);font-size:12px">'+fv(b.quantityOriginal)+'</td>'+
            '<td><div style="font-weight:800;font-size:15px;color:'+qc+'">'+fv(b.quantityOnHand)+'</div><div style="font-size:10px;color:var(--muted)">'+qp+'% còn</div></td>'+
            '<td style="font-weight:600">'+fv(b.unitCost)+' đ</td>'+
            '<td style="font-size:12px;font-weight:600">'+(b.importDate||'').toString().slice(0,10)+'</td>'+
            '<td style="font-size:12px;color:var(--muted)">'+(b.mfd||'')+'</td>'+
            '<td style="font-size:12px;'+expSt+'">'+(b.exp||'')+'</td>'+
            '<td>'+bdg(sCls,sTx)+'</td>'+
        '</tr>';
    }).join('');
}

function renderEmps(){
    var t=document.getElementById('emp-tbody');if(!t)return;
    t.innerHTML='<tr><td colspan="9" class="tbl-empty">Đang tải...</td></tr>';
    // Admin chỉ thấy NV thuộc store của mình.
    var path = ADMIN_STORE_ID ? '/employee/get-by-store/'+ADMIN_STORE_ID : '/employee/get-all';
    apiGet(path).then(function(r){return r.ok?r.json():[];}).then(function(data){
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

function shiftDateRange(){
    // Mặc định: 7 ngày từ thứ Hai tuần này, theo lịch VN.
    // Tạo Date từ midnight VN; getUTCDay() trên Date này = day-of-week theo VN (0=Sun..6=Sat).
    var d=new Date(vnTodayISO()+'T00:00:00+07:00');
    d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
    var monday=d.toISOString().slice(0,10);
    d.setUTCDate(d.getUTCDate()+6);
    var sunday=d.toISOString().slice(0,10);
    return {start:monday, end:sunday};
}
function fmtShiftClock(iso){ return iso ? (fmtVnTime(iso) || '--') : '--'; }
function fmtShiftDate(iso){
    if(!iso)return '';
    var d=new Date(iso); if(isNaN(d))return '';
    return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'});
}
// Lấy giờ:phút theo zone VN của 1 ISO string (vd "07:30") để phân loại Ca Sáng/Chiều/Đêm
function shiftHM(iso){
    var d=new Date(iso); if(isNaN(d))return 0;
    var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d);
    var h=0,m=0;
    parts.forEach(function(p){if(p.type==='hour')h=Number(p.value);if(p.type==='minute')m=Number(p.value);});
    return h*60+m;
}
function shiftStatusBadge(s){
    var map={
        OnTime:['badge-ok','Đúng giờ'],
        Late:['badge-expired','Đi trễ'],
        Absent:['badge-rejected','Vắng'],
        EarlyLeave:['badge-pending','Về sớm'],
        Completed:['badge-paid','Hoàn thành'],
        Scheduled:['badge-inactive','Chưa check-in']
    };
    var m=map[s]||['badge-inactive',s||'--'];
    return bdg(m[0],m[1]);
}
function renderShifts(){
    var dl=document.getElementById('shift-def-list'),t=document.getElementById('shift-tbody');if(!dl||!t)return;
    dl.innerHTML=SDEFS.map(function(d){return '<li class="shift-def-item"><div class="shift-name">'+d.name+'</div><div class="shift-time">'+d.start+'-'+d.end+'</div></li>';}).join('');
    if(!ADMIN_STORE_ID){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Tài khoản admin chưa được gán storeID.</td></tr>';return;}
    var r=shiftDateRange();
    t.innerHTML='<tr><td colspan="7" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/shift/by-store/'+ADMIN_STORE_ID+'/'+r.start+'/'+r.end)
        .then(function(res){return res.ok?res.json():[];})
        .then(function(data){
            SHIFTS_DATA=data||[];
            if(!SHIFTS_DATA.length){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Chưa có ca nào trong tuần này</td></tr>';return;}
            t.innerHTML=SHIFTS_DATA.map(function(s){
                var shiftName='--';
                var inHm=shiftHM(s.timeIn);
                if(inHm<14*60-30)shiftName='Ca Sáng';
                else if(inHm<22*60-30)shiftName='Ca Chiều';
                else shiftName='Ca Đêm';
                return '<tr>'+
                    '<td style="font-weight:600">'+(s.employeeName||'')+'</td>'+
                    '<td>'+(s.storeName||'#'+s.storeID)+'</td>'+
                    '<td>'+shiftName+'</td>'+
                    '<td style="font-size:12px">'+fmtShiftDate(s.timeIn)+' · '+fmtShiftClock(s.timeIn)+'→'+fmtShiftClock(s.timeOut)+'</td>'+
                    '<td style="font-weight:700;color:var(--primary)">'+fmtShiftClock(s.checkIn)+'</td>'+
                    '<td style="font-weight:700">'+fmtShiftClock(s.checkOut)+'</td>'+
                    '<td>'+shiftStatusBadge(s.status)+'</td>'+
                    '</tr>';
            }).join('');
        }).catch(function(){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

function renderTickets(){
    var c=document.getElementById('ticket-cards'),t=document.getElementById('ticket-tbody');if(!c||!t)return;
    t.innerHTML='<tr><td colspan="8" class="tbl-empty">Đang tải...</td></tr>';
    var startEl=document.getElementById('ticket-filter-start'),endEl=document.getElementById('ticket-filter-end');
    if(startEl&&!startEl.value) startEl.value=ticketDefaultStart();
    if(endEl&&!endEl.value)     endEl.value=ticketDefaultEnd();
    var start=startEl?startEl.value:ticketDefaultStart();
    var end=endEl?endEl.value:ticketDefaultEnd();
    apiGet('/ticket/get-all/'+start+'/'+end).then(function(r){return r.ok?r.json():[];}).then(function(data){
        TICKETS_DATA=data||[];
        var now=today();
        if(c)c.innerHTML=(TICKETS_DATA.slice(0,4)).map(function(tk){
            var discPct=Math.round((tk.discount||0)*100);
            return '<div class="ticket-card">'+
                   '<div class="ticket-card-code">'+(tk.ticketID||'').toString().slice(0,8).toUpperCase()+'</div>'+
                   '<div class="ticket-card-info">'+
                   '<span><i class="ti-gift"></i> Giảm '+discPct+'%</span>'+
                   '<span><i class="ti-calendar"></i> '+( tk.startDate||'')+'</span>'+
                   '<span><i class="ti-timer"></i> HSD: '+(tk.endDate||'')+'</span>'+
                   '</div></div>';
        }).join('');
        if(!TICKETS_DATA.length){t.innerHTML='<tr><td colspan="8" class="tbl-empty">Chưa có mã ưu đãi trong khoảng thời gian này</td></tr>';return;}
        t.innerHTML=TICKETS_DATA.map(function(tk){
            var active=tk.endDate>=now&&!tk.deletedAt&&!tk.usedAt;
            var used=!!tk.usedAt;
            var discPct=Math.round((tk.discount||0)*100);
            var statusBadge=used?bdg('badge-expired','Đã dùng'):(active?bdg('badge-active','Khả dụng'):bdg('badge-expired','Hết hạn'));
            return '<tr>'+
                   '<td style="font-weight:800;color:var(--primary);font-size:12px">'+(tk.ticketID||'').toString().slice(0,8).toUpperCase()+'</td>'+
                   '<td style="font-size:11px;color:var(--muted)">'+(tk.ticketID||'')+'</td>'+
                   '<td style="font-weight:700">'+discPct+'%</td>'+
                   '<td style="font-size:12px">'+(tk.startDate||'')+'</td>'+
                   '<td style="font-size:12px">'+(tk.endDate||'')+'</td>'+
                   '<td style="font-size:12px">'+(used?'1':'0')+' / 1</td>'+
                   '<td>'+statusBadge+'</td>'+
                   '<td>'+eBtn('btn-del','ti-trash',"crudDelete('ticket','"+(tk.ticketID)+"')")+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="8" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
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
    t.innerHTML='<tr><td colspan="9" class="tbl-empty">Đang tải dữ liệu...</td></tr>';
    
    var url = '/StockMovement/get-all';
    if(ADMIN_STORE_ID > 0) {
        url += '?storeID=' + ADMIN_STORE_ID;
    }
    
    apiGet(url)
    .then(function(r){ return r.ok ? r.json() : []; })
    .then(function(data){
        var list = Array.isArray(data) ? data : [];
        var inp = list.filter(function(m){ return m.qtyChange > 0; }).length;
        if(s) s.innerHTML=sc('ti-arrow-down','green',inp,'Lần Nhập Kho')+sc('ti-arrow-up','red',list.length-inp,'Lần Xuất Kho');
        
        if(!list.length) {
            t.innerHTML='<tr><td colspan="9" class="tbl-empty">Không có dữ liệu biến động kho</td></tr>';
            return;
        }
        
        t.innerHTML=list.map(function(m){
            var movementType = m.movementType || '';
            var typeLabel = '';
            var badgeClass = '';
            
            if (movementType === 'PurchaseReceipt') {
                typeLabel = 'Nhập kho';
                badgeClass = 'badge-in';
            } else if (movementType === 'Consumption') {
                typeLabel = 'Chế biến';
                badgeClass = 'badge-out';
            } else if (movementType === 'Waste') {
                typeLabel = 'Hao hụt';
                badgeClass = 'badge-out';
            } else if (movementType === 'Processing') {
                typeLabel = 'Sơ chế';
                badgeClass = 'badge-adj';
            } else {
                typeLabel = 'Điều chỉnh';
                badgeClass = 'badge-adj';
            }
            
            var formattedDate = m.timeStamp ? m.timeStamp.replace('T', ' ').slice(0, 19) : '—';
            var qtyChangeStr = (m.qtyChange > 0 ? '+' : '') + m.qtyChange;
            var reasonOrNote = m.reason || m.note || '—';
            var empName = m.employeeName || 'Hệ thống';
            
            var detailBtn = '—';
            if (m.referenceID) {
                detailBtn = '<button class="btn-detail-toggle" onclick="toggleMovDetails(\'' + m.stockMovementID + '\', \'' + m.referenceType + '\', \'' + m.referenceID + '\', this)">Chi tiết</button>';
            }
            
            var rowHtml = '<tr id="mov-row-' + m.stockMovementID + '">'
                + '<td style="font-weight:600">' + (m.ingredientName || '—') + '</td>'
                + '<td>' + (m.batchCode || '—') + '</td>'
                + '<td>' + bdg(badgeClass, typeLabel) + '</td>'
                + '<td style="font-weight:700">' + qtyChangeStr + '</td>'
                + '<td>' + (m.ingredientUnit || '') + '</td>'
                + '<td style="font-size:12px;color:var(--muted)">' + reasonOrNote + '</td>'
                + '<td>' + empName + '</td>'
                + '<td style="font-size:12px">' + formattedDate + '</td>'
                + '<td style="text-align:center">' + detailBtn + '</td>'
                + '</tr>'
                + '<tr class="detail-row" id="detail-row-' + m.stockMovementID + '" style="display:none;">'
                + '<td colspan="9"><div class="mov-detail-content" id="detail-content-' + m.stockMovementID + '">Đang tải chi tiết...</div></td>'
                + '</tr>';
                
            return rowHtml;
        }).join('');
    }).catch(function(err){
        t.innerHTML='<tr><td colspan="9" class="tbl-empty">Lỗi tải dữ liệu: ' + (err.message || '') + '</td></tr>';
    });
}

window.toggleMovDetails = function(movId, refType, refId, btn) {
    var detailRow = document.getElementById('detail-row-' + movId);
    var detailContent = document.getElementById('detail-content-' + movId);
    if (!detailRow || !detailContent) return;
    
    if (detailRow.style.display !== 'none') {
        detailRow.style.display = 'none';
        btn.textContent = 'Chi tiết';
        return;
    }
    
    detailRow.style.display = 'table-row';
    btn.textContent = 'Thu gọn';
    
    detailContent.innerHTML = '<div class="mov-detail-card">Đang tải thông tin chi tiết...</div>';
    
    if (refType === 'Bill') {
        apiGet('/bill/get/' + refId)
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(bill) {
            if (!bill) {
                detailContent.innerHTML = '<div class="mov-detail-card" style="color:var(--red)">Không tìm thấy thông tin hóa đơn.</div>';
                return;
            }
            
            var pMethod = bill.paymentMethods || bill.PaymentMethods || 'Cash';
            var pStatus = bill.paymentStatus || bill.PaymentStatus || 'Pending';
            var pMethodText = pMethod === 'BankTransfer' ? 'Chuyển khoản' : (pMethod === 'Card' ? 'Thẻ' : 'Tiền mặt');
            var pStatusText = pStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
            var customerName = (bill.user && (bill.user.fullName || bill.user.FullName)) || 'Khách vãng lai';
            var storeName = (bill.store && (bill.store.storeName || bill.store.StoreName)) || 'Chi nhánh';
            var tableNum = bill.tableID || bill.tableId || '—';
            
            var detailsListHtml = (bill.billDetail || []).map(function(d) {
                var pVar = d.productVarient || d.ProductVarient || {};
                var prod = pVar.product || pVar.Product || {};
                var prodName = prod.productName || prod.ProductName || ('Mã ' + pVar.productID);
                var sizeText = (pVar.size && pVar.size !== 'Default') ? ' (' + pVar.size + ')' : '';
                return '<tr>'
                    + '<td>' + prodName + sizeText + '</td>'
                    + '<td style="text-align:center">' + d.quantity + '</td>'
                    + '<td style="text-align:right">' + Number(d.price).toLocaleString('vi-VN') + ' đ</td>'
                    + '<td style="text-align:right;font-weight:700">' + Number(d.inlineTotal).toLocaleString('vi-VN') + ' đ</td>'
                    + '</tr>';
            }).join('');
            
            detailContent.innerHTML = 
                '<div class="mov-detail-card">'
                + '  <div class="mov-detail-title">Chi Tiết Đơn Hàng #' + refId.slice(0,8).toUpperCase() + '</div>'
                + '  <div class="mov-detail-grid">'
                + '    <div class="mov-detail-label">Cửa hàng:</div><div class="mov-detail-value">' + storeName + '</div>'
                + '    <div class="mov-detail-label">Khách hàng:</div><div class="mov-detail-value">' + customerName + '</div>'
                + '    <div class="mov-detail-label">Bàn:</div><div class="mov-detail-value">' + tableNum + '</div>'
                + '    <div class="mov-detail-label">Hình thức:</div><div class="mov-detail-value">' + pMethodText + ' (' + pStatusText + ')</div>'
                + '    <div class="mov-detail-label">Tổng cộng:</div><div class="mov-detail-value" style="color:var(--primary)">' + Number(bill.total).toLocaleString('vi-VN') + ' đ</div>'
                + '  </div>'
                + '  <table class="mov-detail-table">'
                + '    <thead>'
                + '      <tr><th>Món ăn</th><th style="text-align:center">SL</th><th style="text-align:right">Đơn giá</th><th style="text-align:right">Thành tiền</th></tr>'
                + '    </thead>'
                + '    <tbody>' + (detailsListHtml || '<tr><td colspan="4" class="tbl-empty">Không có sản phẩm</td></tr>') + '</tbody>'
                + '  </table>'
                + '</div>';
        })
        .catch(function(err) {
            detailContent.innerHTML = '<div class="mov-detail-card" style="color:var(--red)">Lỗi tải chi tiết hóa đơn: ' + err.message + '</div>';
        });
    } else if (refType === 'GoodsReceipt') {
        apiGet('/receipt/getid/' + refId)
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(receipt) {
            if (!receipt) {
                detailContent.innerHTML = '<div class="mov-detail-card" style="color:var(--red)">Không tìm thấy thông tin phiếu nhập kho.</div>';
                return;
            }
            
            var supplierName = (receipt.supplier && (receipt.supplier.supplierName || receipt.supplier.SupplierName)) || 'Nhà cung cấp';
            var employeeName = (receipt.employee && (receipt.employee.fullName || receipt.employee.FullName)) || 'Nhân viên';
            var storeName = (receipt.store && (receipt.store.storeName || receipt.store.StoreName)) || 'Chi nhánh';
            var poText = (receipt.poid || receipt.poID) ? ('PO #' + (receipt.poid || receipt.poID).slice(0, 8).toUpperCase()) : 'Trực tiếp (Không PO)';
            
            var detailsListHtml = (receipt.receiptDetail || []).map(function(d) {
                var ing = d.ingredient || d.Ingredient || {};
                var ingName = ing.ingredientName || ing.IngredientName || ('Mã ' + d.ingredientID);
                var unitText = ing.ingredientUnit || ing.IngredientUnit || '';
                return '<tr>'
                    + '<td>' + ingName + '</td>'
                    + '<td style="text-align:center">' + d.quantity + '</td>'
                    + '<td style="text-align:center;color:var(--green);font-weight:700">' + d.goodQuantity + '</td>'
                    + '<td>' + unitText + '</td>'
                    + '<td style="text-align:right">' + Number(d.unitPrice).toLocaleString('vi-VN') + ' đ</td>'
                    + '<td style="text-align:right;font-weight:700">' + Number(d.goodQuantity * d.unitPrice).toLocaleString('vi-VN') + ' đ</td>'
                    + '</tr>';
            }).join('');
            
            var totalAmount = (receipt.receiptDetail || []).reduce(function(acc, d) {
                return acc + (d.goodQuantity * d.unitPrice);
            }, 0);
            
            detailContent.innerHTML = 
                '<div class="mov-detail-card">'
                + '  <div class="mov-detail-title">Chi Tiết Phiếu Nhập #' + refId.slice(0,8).toUpperCase() + '</div>'
                + '  <div class="mov-detail-grid">'
                + '    <div class="mov-detail-label">Cửa hàng:</div><div class="mov-detail-value">' + storeName + '</div>'
                + '    <div class="mov-detail-label">Nhà cung cấp:</div><div class="mov-detail-value">' + supplierName + '</div>'
                + '    <div class="mov-detail-label">Người nhập:</div><div class="mov-detail-value">' + employeeName + '</div>'
                + '    <div class="mov-detail-label">Đơn PO:</div><div class="mov-detail-value">' + poText + '</div>'
                + '    <div class="mov-detail-label">Tổng giá trị:</div><div class="mov-detail-value" style="color:var(--primary)">' + Number(totalAmount).toLocaleString('vi-VN') + ' đ</div>'
                + '  </div>'
                + '  <table class="mov-detail-table">'
                + '    <thead>'
                + '      <tr><th>Nguyên liệu</th><th style="text-align:center">Nhập</th><th style="text-align:center">Đạt</th><th>Đơn vị</th><th style="text-align:right">Đơn giá</th><th style="text-align:right">Thành tiền</th></tr>'
                + '    </thead>'
                + '    <tbody>' + (detailsListHtml || '<tr><td colspan="6" class="tbl-empty">Không có chi tiết nhập kho</td></tr>') + '</tbody>'
                + '  </table>'
                + '</div>';
        })
        .catch(function(err) {
            detailContent.innerHTML = '<div class="mov-detail-card" style="color:var(--red)">Lỗi tải chi tiết phiếu nhập: ' + err.message + '</div>';
        });
    } else {
        detailContent.innerHTML = '<div class="mov-detail-card">Không hỗ trợ hiển thị chi tiết cho loại tham chiếu này.</div>';
    }
};

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
    recipe:'',
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
           '<div class="form-group"><label class="form-label">Số lượng mã</label><input id="f-qty" type="number" class="form-control" placeholder="100"></div>',
    warehouse:'<div class="form-group"><label class="form-label">Sức Chứa Mới</label><input id="f-wh-cap" type="number" class="form-control" placeholder="VD: 1000" min="1"></div>'
};

function getV(id){var e=document.getElementById(id);return e?e.value.trim():'';}

function crudAdd(type){
    if(type==='recipe'){openRecipeModal();return;}
    if(type==='warehouse'){openWarehouseModal();return;}
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
        } else if(type==='warehouse'){
            apiPut('/warehouse/update/'+id,{Capacity:parseInt(getV('f-wh-cap'))||0})
            .then(function(r){if(r.ok){showToast('Cập nhật kho thành công','success');closeModal();renderInv();}else{showToast('Cập nhật thất bại','error');}});
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
    else if(type==='warehouse') path='/warehouse/delete/'+id;

    if(!path){showToast('Chưa hỗ trợ xóa '+type,'warning');return;}
    apiDelete(path).then(function(r){
        if(r.ok){showToast('Đã xóa thành công','success');showSection(document.querySelector('.adm-section.active').id.replace('section-',''));}
        else{showToast('Xóa thất bại','error');}
    }).catch(function(){showToast('Lỗi kết nối','error');});
};

// Wire up Add buttons
var addBtns={'btn-add-store':'store','btn-add-product':'product','btn-add-recipe':'recipe','btn-add-supplier':'supplier','btn-add-emp':'emp','btn-add-ticket':'ticket','btn-add-warehouse':'warehouse'};
Object.keys(addBtns).forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.addEventListener('click',function(){crudAdd(addBtns[id]);});
});

// Buttons riêng cho shift & receipt — không đi qua FORMS template.
var _btnShift=document.getElementById('btn-add-shift');
if(_btnShift)_btnShift.addEventListener('click',openShiftAssignModal);
var _btnRcp=document.getElementById('btn-add-receipt');
if(_btnRcp)_btnRcp.addEventListener('click',openReceiptModal);
var _btnRcpFilter=document.getElementById('btn-filter-receipt');
if(_btnRcpFilter)_btnRcpFilter.addEventListener('click',renderReceipts);

// ===== PHIẾU NHẬP =====
function todayMinusDays(n){var d=new Date(vnTodayISO()+'T00:00:00+07:00');d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10);}

function renderReceipts(){
    var t=document.getElementById('receipt-tbody');if(!t)return;
    if(!ADMIN_STORE_ID){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Tài khoản admin chưa được gán storeID.</td></tr>';return;}
    var sEl=document.getElementById('receipt-filter-start'),eEl=document.getElementById('receipt-filter-end');
    if(sEl && !sEl.value) sEl.value=todayMinusDays(30);
    if(eEl && !eEl.value) eEl.value=today();
    var start=sEl?sEl.value:todayMinusDays(30), end=eEl?eEl.value:today();
    t.innerHTML='<tr><td colspan="7" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/receipt/by-store/'+ADMIN_STORE_ID+'/'+start+'/'+end)
        .then(function(r){return r.ok?r.json():[];})
        .then(function(data){
            RECEIPTS_DATA=data||[];
            if(!RECEIPTS_DATA.length){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Chưa có phiếu nhập nào</td></tr>';return;}
            t.innerHTML=RECEIPTS_DATA.map(function(r){
                var st=r.confirmedAt?bdg('badge-paid','Đã xác nhận'):bdg('badge-pending','Đang chờ');
                return '<tr>'+
                    '<td style="font-weight:700;color:var(--primary);font-family:monospace">'+(r.receiptID||'').slice(0,8).toUpperCase()+'</td>'+
                    '<td style="font-size:12px">'+(r.dateReceive||'').slice(0,10)+'</td>'+
                    '<td style="font-weight:600">'+(r.supplierName||'#'+r.supplierID)+'</td>'+
                    '<td>'+(r.employeeName||'')+'</td>'+
                    '<td style="font-weight:700">'+r.lineCount+'</td>'+
                    '<td style="font-weight:700;color:var(--primary)">'+fv(r.totalAmount)+' đ</td>'+
                    '<td>'+st+'</td>'+
                '</tr>';
            }).join('');
        }).catch(function(){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

function openReceiptModal(){
    if(!ADMIN_STORE_ID){showToast('Tài khoản admin chưa được gán storeID','error');return;}
    Promise.all([
        apiGet('/supplier/get-all').then(function(r){return r.ok?r.json():[];}),
        apiGet('/ingredient/get-all').then(function(r){return r.ok?r.json():[];})
    ]).then(function(res){
        var supps=res[0]||[], ings=res[1]||[]; INGREDIENTS_DATA=ings;
        var suppOpts='<option value="">-- Chọn NCC --</option>'+supps.map(function(s){return '<option value="'+s.supplierID+'">'+s.supplierName+'</option>';}).join('');
        var ingOpts='<option value="">-- Nguyên liệu --</option>'+ings.map(function(i){return '<option value="'+i.ingredientID+'">'+i.ingredientName+' ('+i.ingredientUnit+')</option>';}).join('');
        var body=
            '<div class="form-group"><label class="form-label">Nhà cung cấp</label><select id="f-rcp-supp" class="form-control">'+suppOpts+'</select></div>'+
            '<div class="form-group"><label class="form-label">Danh sách nguyên liệu</label>'+
                '<div id="rcp-lines"></div>'+
                '<button type="button" class="btn-secondary" id="btn-add-rcp-line" style="margin-top:8px;padding:6px 14px;font-size:13px">+ Thêm dòng</button>'+
            '</div>';
        openModal('Lập Phiếu Nhập (Store #'+ADMIN_STORE_ID+')', body, function(){
            var suppID=parseInt(document.getElementById('f-rcp-supp').value)||0;
            if(!suppID){showToast('Vui lòng chọn nhà cung cấp','warning');return;}
            var rows=document.querySelectorAll('.rcp-line-row');
            var lines=[];
            rows.forEach(function(row){
                var iid=parseInt(row.querySelector('.f-rcp-ing').value)||0;
                var qty=parseFloat(row.querySelector('.f-rcp-qty').value)||0;
                var good=parseFloat(row.querySelector('.f-rcp-good').value)||0;
                var price=parseFloat(row.querySelector('.f-rcp-price').value)||0;
                if(iid>0 && qty>0)lines.push({IngredientID:iid,Quantity:qty,GoodQuantity:good,UnitPrice:price});
            });
            if(!lines.length){showToast('Vui lòng thêm ít nhất 1 nguyên liệu','warning');return;}
            var empID=localStorage.getItem('employeeId')||'';
            apiPost('/receipt/create-direct/'+ADMIN_STORE_ID,{
                EmployeeID:empID, SupplierID:suppID, ReceiptLines:lines
            }).then(function(r){
                if(r.status===201 || r.ok){
                    showToast('Lập phiếu nhập thành công','success');
                    closeModal();renderReceipts();
                } else {
                    r.json().then(function(d){showToast(d.message||'Lập phiếu thất bại','error');}).catch(function(){showToast('Lập phiếu thất bại','error');});
                }
            }).catch(function(){showToast('Lỗi kết nối','error');});
        });
        var ll=document.getElementById('rcp-lines');
        function addRow(){
            var row=document.createElement('div');
            row.className='rcp-line-row';
            row.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:6px;';
            row.innerHTML=
                '<select class="form-control f-rcp-ing" style="flex:2">'+ingOpts+'</select>'+
                '<input class="form-control f-rcp-qty" type="number" placeholder="SL" min="0" step="0.01" style="flex:1">'+
                '<input class="form-control f-rcp-good" type="number" placeholder="SL Tốt" min="0" step="0.01" style="flex:1">'+
                '<input class="form-control f-rcp-price" type="number" placeholder="Đơn giá" min="0" step="1" style="flex:1">'+
                '<button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:4px 8px"><i class="ti-trash"></i></button>';
            ll.appendChild(row);
        }
        document.getElementById('btn-add-rcp-line').addEventListener('click',addRow);
        addRow();
    }).catch(function(){showToast('Lỗi tải dữ liệu NCC/nguyên liệu','error');});
}

// ===== MODAL PHÂN CA =====
function pad2(n){return (n<10?'0':'')+n;}
function combineDateTime(dateStr,hhmm){
    if(!dateStr||!hhmm)return null;
    // Gắn +07:00 để BE hiểu là giờ VN bất kể server timezone.
    return dateStr+'T'+hhmm+':00+07:00';
}
function openShiftAssignModal(){
    if(!ADMIN_STORE_ID){showToast('Tài khoản admin chưa được gán storeID','error');return;}
    apiGet('/employee/get-by-store/'+ADMIN_STORE_ID).then(function(r){return r.ok?r.json():[];}).then(function(emps){
        var empOpts='<option value="">-- Chọn nhân viên --</option>'+(emps||[]).map(function(e){
            return '<option value="'+e.userID+'">'+(e.fullName||e.userName)+' ('+e.role+')</option>';
        }).join('');
        var defOpts=SDEFS.map(function(d){return '<option value="'+d.key+'">'+d.name+' ('+d.start+'-'+d.end+')</option>';}).join('');
        var body=
            '<div class="form-group"><label class="form-label">Nhân viên</label><select id="f-shift-emp" class="form-control">'+empOpts+'</select></div>'+
            '<div class="form-group"><label class="form-label">Ngày làm</label><input type="date" id="f-shift-date" class="form-control" value="'+today()+'"></div>'+
            '<div class="form-group"><label class="form-label">Ca</label><select id="f-shift-def" class="form-control">'+defOpts+'<option value="custom">Tùy chỉnh</option></select></div>'+
            '<div class="form-group" id="g-shift-custom" style="display:none;">'+
                '<label class="form-label">Bắt đầu - Kết thúc</label>'+
                '<div style="display:flex;gap:8px"><input type="time" id="f-shift-in" class="form-control"><input type="time" id="f-shift-out" class="form-control"></div>'+
            '</div>';
        openModal('Phân ca cho nhân viên', body, function(){
            var empID=document.getElementById('f-shift-emp').value;
            var date=document.getElementById('f-shift-date').value;
            var defKey=document.getElementById('f-shift-def').value;
            if(!empID){showToast('Vui lòng chọn nhân viên','warning');return;}
            if(!date){showToast('Vui lòng chọn ngày','warning');return;}
            var inT,outT,nextDay=false;
            if(defKey==='custom'){
                inT=document.getElementById('f-shift-in').value;
                outT=document.getElementById('f-shift-out').value;
            } else {
                var def=SDEFS.find(function(d){return d.key===defKey;});
                if(!def){showToast('Ca không hợp lệ','warning');return;}
                inT=def.start; outT=def.end;
                if(def.key==='night')nextDay=true;
            }
            if(!inT||!outT){showToast('Vui lòng nhập giờ','warning');return;}
            var endDate=date;
            if(nextDay){
                var dd=new Date(date+'T00:00:00+07:00'); dd.setUTCDate(dd.getUTCDate()+1); endDate=dd.toISOString().slice(0,10);
            }
            apiPost('/shift/assign/'+ADMIN_STORE_ID,{
                EmployeeID: empID,
                TimeIn: combineDateTime(date,inT),
                TimeOut: combineDateTime(endDate,outT)
            }).then(function(r){
                if(r.ok){showToast('Phân ca thành công','success');closeModal();renderShifts();}
                else r.json().then(function(d){showToast(d.message||'Phân ca thất bại','error');}).catch(function(){showToast('Phân ca thất bại','error');});
            }).catch(function(){showToast('Lỗi kết nối','error');});
        });
        document.getElementById('f-shift-def').addEventListener('change',function(){
            document.getElementById('g-shift-custom').style.display=(this.value==='custom')?'block':'none';
        });
    }).catch(function(){showToast('Không tải được danh sách nhân viên','error');});
}

// ===== INVENTORY FILTERS =====
document.querySelectorAll('#inv-status-tabs .ftab').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#inv-status-tabs .ftab').forEach(function(x){x.classList.remove('active');});this.classList.add('active');invStatusFilter=this.getAttribute('data-sfilter');renderBatchTable();});});
document.querySelectorAll('#inv-type-tabs .ftab').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#inv-type-tabs .ftab').forEach(function(x){x.classList.remove('active');});this.classList.add('active');invTypeFilter=this.getAttribute('data-tfilter');renderBatchTable();});});
var _invWhSel=document.getElementById('inv-wh-filter');
if(_invWhSel)_invWhSel.addEventListener('change',function(){invWhFilter=this.value;renderBatchTable();});
var _invIngInput=document.getElementById('inv-ing-search');
if(_invIngInput)_invIngInput.addEventListener('input',function(){invIngSearch=this.value.toLowerCase().trim();renderBatchTable();});

// ===== WAREHOUSE MODAL =====
function openWarehouseModal(){
    var stProm=STORES_DATA.length>0?Promise.resolve(STORES_DATA):apiGet('/store/get-all').then(function(r){return r.ok?r.json():[];});
    stProm.then(function(stores){
        STORES_DATA=stores;
        var opts='<option value="">-- Chọn chi nhánh --</option>'+stores.map(function(s){return '<option value="'+s.storeID+'">'+s.storeName+'</option>';}).join('');
        var body=
            '<div class="form-group"><label class="form-label">Chi Nhánh</label>'+
            '<select id="f-wh-store" class="form-control">'+opts+'</select></div>'+
            '<div class="form-group"><label class="form-label">Sức Chứa (đơn vị kho)</label>'+
            '<input id="f-wh-cap" type="number" class="form-control" placeholder="VD: 1000" min="1"></div>';
        openModal('Thêm Kho Mới',body,function(){
            var sid=parseInt((document.getElementById('f-wh-store')||{}).value)||0;
            var cap=parseInt((document.getElementById('f-wh-cap')||{}).value)||0;
            if(!sid){showToast('Vui lòng chọn chi nhánh','warning');return;}
            if(!cap){showToast('Sức chứa phải lớn hơn 0','warning');return;}
            apiPost('/warehouse/create',{StoreID:sid,Capacity:cap})
            .then(function(r){if(r.ok){showToast('Tạo kho thành công','success');closeModal();renderInv();}else{showToast('Tạo kho thất bại','error');}})
            .catch(function(){showToast('Lỗi kết nối','error');});
        });
    }).catch(function(){showToast('Không thể tải danh sách chi nhánh','error');});
}


// ===== RECIPE MODAL =====
var RECIPE_INGREDIENTS_DATA=[];

function openRecipeModal(){
    Promise.all([
        apiGet('/product/get-all').then(function(r){return r.ok?r.json():[];}),
        apiGet('/ingredient/get-all').then(function(r){return r.ok?r.json():[];})
    ]).then(function(res){
        var prods=res[0]||[], ings=res[1]||[];
        RECIPE_INGREDIENTS_DATA=ings;

        var prodOpts='<option value="">-- Chọn sản phẩm --</option>'+prods.map(function(p){
            return '<option value="'+p.productID+'">'+p.productName+'</option>';
        }).join('');

        var body=
            '<div class="form-group">'+
                '<label class="form-label">Sản phẩm</label>'+
                '<select id="f-recipe-prod" class="form-control">'+prodOpts+'</select>'+
            '</div>'+
            '<div class="form-group">'+
                '<label class="form-label">Kích cỡ / Biến thể</label>'+
                '<select id="f-recipe-pv" class="form-control"><option value="">-- Chọn sản phẩm trước --</option></select>'+
            '</div>'+
            '<div class="form-group">'+
                '<label class="form-label">Danh sách nguyên liệu</label>'+
                '<div id="recipe-ing-list"></div>'+
                '<button type="button" class="btn-secondary" id="btn-add-ing-row" style="margin-top:8px;padding:6px 14px;font-size:13px">+ Thêm nguyên liệu</button>'+
            '</div>';

        openModal('Thêm Công Thức', body, function(){
            var pvId=parseInt(document.getElementById('f-recipe-pv').value)||0;
            if(!pvId){showToast('Vui lòng chọn biến thể sản phẩm','warning');return;}
            var rows=document.querySelectorAll('.recipe-ing-row');
            var items=[];
            rows.forEach(function(row){
                var ingId=parseInt(row.querySelector('.f-ing-sel').value)||0;
                var qty1=parseFloat(row.querySelector('.f-qty1').value)||0;
                var qty2=parseFloat(row.querySelector('.f-qty2').value)||0;
                if(ingId>0)items.push({IngredientID:ingId,QtyBeforeProcess:qty1,QtyAfterProcess:qty2});
            });
            if(!items.length){showToast('Vui lòng thêm ít nhất một nguyên liệu','warning');return;}
            apiPost('/recipe/add-bulk',{ProductVarientID:pvId,Items:items})
                .then(function(r){
                    if(r.ok){showToast('Lưu công thức thành công','success');closeModal();renderRecipes();}
                    else{r.text().then(function(t){showToast(t||'Lưu thất bại','error');});}
                }).catch(function(){showToast('Lỗi kết nối','error');});
        });

        // Wire product → variant
        var prodSel=document.getElementById('f-recipe-prod');
        var pvSel=document.getElementById('f-recipe-pv');
        if(prodSel)prodSel.addEventListener('change',function(){
            var pid=parseInt(this.value)||0;
            var prod=prods.find(function(p){return p.productID===pid;});
            pvSel.innerHTML='<option value="">-- Chọn kích cỡ --</option>';
            if(prod&&prod.productVarient&&prod.productVarient.length){
                prod.productVarient.forEach(function(pv){
                    var lbl=pv.size==='Default'?'Mặc định':pv.size;
                    pvSel.innerHTML+='<option value="'+pv.productVarientID+'">'+lbl+' — '+fv(pv.price)+' đ</option>';
                });
            }
        });

        // Add ingredient row button
        var ingOpts='<option value="">-- Chọn nguyên liệu --</option>'+ings.map(function(i){
            return '<option value="'+i.ingredientID+'">'+i.ingredientName+' ('+i.ingredientUnit+')</option>';
        }).join('');
        var addIngBtn=document.getElementById('btn-add-ing-row');
        var ingList=document.getElementById('recipe-ing-list');
        function addIngRow(){
            var row=document.createElement('div');
            row.className='recipe-ing-row';
            row.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:6px;';
            row.innerHTML=
                '<select class="form-control f-ing-sel" style="flex:2">'+ingOpts+'</select>'+
                '<input class="form-control f-qty1" type="number" placeholder="Trước (g)" min="0" step="0.01" style="flex:1">'+
                '<input class="form-control f-qty2" type="number" placeholder="Sau (g)" min="0" step="0.01" style="flex:1">'+
                '<button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:4px 8px"><i class="ti-trash"></i></button>';
            if(ingList)ingList.appendChild(row);
        }
        if(addIngBtn)addIngBtn.addEventListener('click',addIngRow);
        addIngRow();
    }).catch(function(){showToast('Lỗi tải dữ liệu','error');});
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',function(){showSection('dashboard');});
