// Auth Guard
(function(){
    var r=localStorage.getItem('role');
    if(r!=='admin'){showPopup({type:'error',title:'Không có quyền',message:'Bạn không có quyền truy cập trang quản trị.'}).then(function(){window.location.href='index.html';});return;}
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
    {key:'evening', name:'Ca Chiều', start:'14:00', end:'22:00'}
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
        apiGet('/bill/get-all/'+yearRange()+(ADMIN_STORE_ID?('?storeID='+ADMIN_STORE_ID):''), true).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];})
    ]).then(function(res){
        var stores=res[0]||[], bills=res[1]||[];
        // Chỉ giữ store của admin hiện tại (phòng trường hợp token cũ chưa có claim StoreID).
        if(ADMIN_STORE_ID)stores=stores.filter(function(s){return s.storeID===ADMIN_STORE_ID;});
        STORES_DATA=stores; BILLS_DATA=bills;
        var rev=bills.reduce(function(a,b){return a+(b.total||0);},0);
        if(d)d.innerHTML=sc('ti-money','orange',fv(rev)+' đ','Doanh thu')+sc('ti-receipt','blue',bills.length,'Tổng HĐ')+sc('ti-map','green',stores.length,'Cửa hàng');
        var bt=document.getElementById('dash-bill-tbody');
        if(bt)bt.innerHTML=bills.slice(0,4).map(function(b){return '<tr><td style="font-weight:700;color:var(--primary)">'+b.billID+'</td><td>'+(b.store?b.store.storeName:'')+'</td><td style="font-weight:600">'+fv(b.total)+' đ</td><td>'+bdg('badge-paid','Hoàn thành')+'</td></tr>';}).join('')||'<tr><td colspan="4" class="tbl-empty">Không có dữ liệu</td></tr>';
    });
    var et=document.getElementById('dash-exp-tbody');
    if(et){apiGet('/inventorybatch/available-raw'+(ADMIN_STORE_ID?('?storeID='+ADMIN_STORE_ID):'')).then(function(r){return r.ok?r.json():[];}).then(function(batches){var now=new Date();var exp7=batches.filter(function(b){var d=new Date(b.exp);return (d-now)/86400000<=7&&(d-now)>=0;});et.innerHTML=exp7.slice(0,5).map(function(b){return '<tr><td style="font-weight:600">'+(b.ingredient?b.ingredient.ingredientName:'#'+b.ingredientID)+'</td><td>'+(b.warehouse&&b.warehouse.store?b.warehouse.store.storeName:'')+'</td><td style="color:var(--red);font-weight:700">'+b.exp+'</td><td style="font-weight:700">'+fv(b.quantityOnHand)+' '+(b.ingredient?b.ingredient.ingredientUnit:'')+'</td></tr>';}).join('')||'<tr><td colspan="4" class="tbl-empty">Không có lô nào sắp hết hạn</td></tr>';}).catch(function(){et.innerHTML='<tr><td colspan="4" class="tbl-empty">—</td></tr>';});}
}

function renderStores(){
    var c=document.getElementById('store-cards');if(!c)return;
    c.innerHTML='<div class="tbl-empty">Đang tải...</div>';
    apiGet('/store/get-all').then(function(r){return r.json();}).then(function(data){
        // Admin chỉ quản lý store của mình (lọc thêm ở FE phòng token cũ chưa có claim StoreID).
        STORES_DATA=(data||[]).filter(function(s){return !ADMIN_STORE_ID||s.storeID===ADMIN_STORE_ID;});
        if(!STORES_DATA.length){c.innerHTML='<div class="tbl-empty">Chưa có cửa hàng nào</div>';return;}
        c.innerHTML=STORES_DATA.map(function(s){
            return '<div class="store-card"><div class="store-card-header"><div class="store-card-name">'+s.storeName+'</div>'+bdg('badge-active','Hoạt động')+'</div>'+
                   '<div class="store-card-body"><div><i class="ti-mobile"></i> '+s.phone+'</div><div><i class="ti-email"></i> '+s.email+'</div><div><i class="ti-layout-list-thumb-alt"></i> Sức chứa: <b>'+s.seatingCapacity+'</b></div></div>'+
                   '<div class="store-card-footer">'+eBtn('btn-edit','ti-pencil',"crudEdit('store','"+s.storeID+"')")+eBtn('btn-del','ti-trash',"crudDelete('store','"+s.storeID+"')")+'</div></div>';
        }).join('');
    }).catch(function(){c.innerHTML='<div class="tbl-empty">Lỗi tải dữ liệu</div>';});
}

// ===== SIZE / BIẾN THỂ helpers =====
var SIZE_LABELS={Default:'Mặc định',S:'S',M:'M',L:'L',XL:'XL'};
var SIZE_ORDER=['Default','S','M','L','XL'];
function activeVarients(p){return (p.productVarient||[]).filter(function(v){return !v.deletedAt;});}

// Bộ lọc danh mục đang chọn ("all" = tất cả). Danh mục = productType của sản phẩm.
var prodCatFilter='all';

// Đổ danh sách danh mục vào combobox lọc (cạnh nút "Thêm Sản Phẩm"): mỗi danh
// mục (productType) kèm số lượng sản phẩm; chọn để lọc bảng. Sự kiện change được
// gắn 1 lần ở phần wiring bên dưới.
function renderCatList(){
    var sel=document.getElementById('cat-filter');if(!sel)return;
    var counts={};
    PRODS_DATA.forEach(function(p){var t=p.productType||'—';counts[t]=(counts[t]||0)+1;});
    var cats=Object.keys(counts).sort();
    // Nếu danh mục đang lọc không còn tồn tại thì quay về "Tất cả".
    if(prodCatFilter!=='all'&&cats.indexOf(prodCatFilter)<0)prodCatFilter='all';
    var html='<option value="all">Tất cả ('+PRODS_DATA.length+')</option>';
    html+=cats.map(function(c){
        return '<option value="'+c+'">'+c+' ('+counts[c]+')</option>';
    }).join('');
    sel.innerHTML=html;
    sel.value=prodCatFilter;
}

// Mỗi sản phẩm là 1 dòng nhóm có dropdown chọn size (giống bên Công Thức);
// chọn size sẽ hiện dòng chi tiết của biến thể đó để xem giá và xoá riêng lẻ.
function renderProds(){
    var pt=document.getElementById('product-tbody');if(!pt)return;
    pt.innerHTML='<tr><td colspan="7" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/product/get-all').then(function(r){return r.json();}).then(function(data){
        // Ẩn sản phẩm đã xoá mềm (get-all trả về cả bản ghi DeletedAt).
        PRODS_DATA=(data||[]).filter(function(p){return !p.deletedAt;});
        renderCatList();
        renderProdTable();
    }).catch(function(){pt.innerHTML='<tr><td colspan="7" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

// Render bảng sản phẩm theo bộ lọc danh mục + ô tìm kiếm.
function renderProdTable(){
    var pt=document.getElementById('product-tbody');if(!pt)return;
    if(!PRODS_DATA.length){pt.innerHTML='<tr><td colspan="7" class="tbl-empty">Chưa có sản phẩm</td></tr>';return;}
    var q=((document.getElementById('product-search')||{}).value||'').trim().toLowerCase();
    var list=PRODS_DATA.filter(function(p){
        if(prodCatFilter!=='all'&&p.productType!==prodCatFilter)return false;
        if(q&&(p.productName||'').toLowerCase().indexOf(q)<0)return false;
        return true;
    });
    if(!list.length){pt.innerHTML='<tr><td colspan="7" class="tbl-empty">Không có sản phẩm phù hợp</td></tr>';return;}
    var lbl=function(s){return SIZE_LABELS[s]||s;};
    var html='';
    list.forEach(function(p){
            var vs=activeVarients(p).sort(function(a,b){return SIZE_ORDER.indexOf(a.size)-SIZE_ORDER.indexOf(b.size);});
            var minPrice=vs.length?Math.min.apply(null,vs.map(function(v){return v.price;})):null;
            var statusBdg=vs.length?bdg('badge-active','Đang bán'):bdg('badge-inactive','Chưa có size');
            
            // Thay thế dropdown bằng danh sách các badge size
            var variantsDisplay;
            if(vs.length){
                variantsDisplay = vs.map(function(v){
                    return bdg('badge-inactive', lbl(v.size));
                }).join(' ');
            } else {
                variantsDisplay = '<span style="color:var(--muted);font-size:12px">Chưa có size</span>';
            }
            
            // Dòng nhóm sản phẩm
            html+='<tr class="product-grp-row">'+
                '<td>'+p.productID+'</td>'+
                '<td style="font-weight:600">'+p.productName+'</td>'+
                '<td>'+p.productType+'</td>'+
                '<td>'+variantsDisplay+'</td>'+
                '<td style="font-weight:600;color:var(--primary)">'+(minPrice!=null?fv(minPrice)+' đ':'—')+'</td>'+
                '<td>'+statusBdg+'</td>'+
                '<td style="white-space:nowrap">'+
                    '<button class="btn-edit" title="Thêm size" onclick="addVarient('+p.productID+')"><i class="ti-plus"></i></button>'+
                    eBtn('btn-edit','ti-pencil',"crudEdit('product','"+p.productID+"')")+
                    eBtn('btn-del','ti-trash',"crudDelete('product','"+p.productID+"')")+
                '</td></tr>';
            // Dòng chi tiết từng size (hiển thị tất cả các size)
            vs.forEach(function(v){
                html+='<tr class="product-line-row" data-prod="'+p.productID+'" data-pv="'+v.productVarientID+'">'+
                    '<td></td>'+
                    '<td colspan="3" style="padding-left:22px;color:var(--muted);font-size:13px">↳ Size <b>'+lbl(v.size)+'</b>'+(v.forPeople?(' · '+v.forPeople+' người'):'')+'</td>'+
                    '<td style="font-weight:600;color:var(--primary)">'+fv(v.price)+' đ</td>'+
                    '<td>'+bdg('badge-active','Đang bán')+'</td>'+
                    '<td>'+eBtn('btn-del','ti-trash',"deleteVarient('"+v.productVarientID+"','"+lbl(v.size)+"')")+'</td></tr>';
            });
        });
    pt.innerHTML=html;
}

// Đổi size trong dropdown sản phẩm: chỉ hiện dòng chi tiết của biến thể đó.
window.onProductSizeChange=function(sel){
    var pid=sel.getAttribute('data-prod');
    var pv=sel.value;
    document.querySelectorAll('.product-line-row[data-prod="'+pid+'"]').forEach(function(row){
        row.style.display=(row.getAttribute('data-pv')===pv)?'':'none';
    });
};

// Thêm 1 size (biến thể) cho sản phẩm — loại bỏ các size đã có để tránh trùng.
window.addVarient=function(productID){
    var p=PRODS_DATA.find(function(x){return x.productID===productID;});
    if(!p){showToast('Không tìm thấy sản phẩm','error');return;}
    var used=activeVarients(p).map(function(v){return v.size;});
    var pool=(p.productType==='Combo')?['Default']:SIZE_ORDER;
    var avail=pool.filter(function(s){return used.indexOf(s)<0;});
    if(!avail.length){showToast('Sản phẩm đã có đủ tất cả size','warning');return;}
    var opts=avail.map(function(s){return '<option value="'+s+'">'+(SIZE_LABELS[s]||s)+'</option>';}).join('');
    var body='<div class="form-group"><label class="form-label">Kích cỡ (Size)</label><select id="f-size" class="form-control">'+opts+'</select></div>'+
        '<div class="form-group"><label class="form-label">Giá (VND)</label><input id="f-price" type="number" class="form-control" placeholder="35000"></div>'+
        '<div class="form-group"><label class="form-label">Số người (tuỳ chọn)</label><input id="f-people" type="number" class="form-control" placeholder="VD: 2"></div>';
    openModal('Thêm size — '+p.productName, body, function(){
        var price=parseFloat(getV('f-price'))||0;
        if(price<=0){showToast('Vui lòng nhập giá hợp lệ','warning');return;}
        var people=parseInt(getV('f-people'));
        apiPost('/product/add-varient',{ProductID:productID,Size:getV('f-size'),Price:price,ForPeople:isNaN(people)?null:people})
            .then(function(r){
                if(r.ok){showPopup({type:'success',title:'Thành công',message:'Thêm size thành công.'});closeModal();renderProds();}
                else{r.text().then(function(tx){showPopup({type:'error',title:'Thêm size thất bại',message:tx||'Không thể thêm size.'});}).catch(function(){showPopup({type:'error',title:'Thêm size thất bại',message:'Không thể thêm size.'});});}
            }).catch(function(){showToast('Lỗi kết nối','error');});
    });
};

// Xoá 1 size (biến thể) cụ thể — cascade xoá công thức liên quan ở BE.
window.deleteVarient=function(productVarientID,label){
    showConfirm({type:'error',danger:true,title:'Xoá size',message:'Xoá size "'+(label||'')+'"? Công thức liên quan cũng sẽ bị xoá.',confirmText:'Xoá'}).then(function(ok){
        if(!ok)return;
        apiDelete('/product/soft-delete-varient/'+productVarientID)
            .then(function(r){
                if(r.ok){showPopup({type:'success',message:'Đã xoá size'});renderProds();}
                else{showPopup({type:'error',message:'Xoá size thất bại'});}
            }).catch(function(){showPopup({type:'error',message:'Lỗi kết nối'});});
    });
};

// Gom công thức theo sản phẩm; mỗi sản phẩm có dropdown chọn size để xem
// nguyên liệu của từng biến thể, xoá từng nguyên liệu hoặc xoá cả công thức của 1 size.
function renderRecipes(){
    var t=document.getElementById('recipe-tbody');if(!t)return;
    t.innerHTML='<tr><td colspan="5" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/recipe/get-all').then(function(r){return r.json();}).then(function(data){
        data=data||[];
        if(!data.length){t.innerHTML='<tr><td colspan="5" class="tbl-empty">Chưa có công thức</td></tr>';return;}
        // Gom theo productID -> {name, variants: {pvId: {size, lines:[...]}}}
        var byProd={};
        window.__recipeVarLines={}; // pvId -> [{ingredientID, productVarientID}]
        data.forEach(function(r){
            var pv=r.productVarient||{};
            var prod=pv.product||{};
            var pid=prod.productID||pv.productID||0;
            var pname=prod.productName||('#'+r.productVarientID);
            var pvId=r.productVarientID;
            var size=pv.size||'Default';
            if(!byProd[pid])byProd[pid]={name:pname,variants:{}};
            if(!byProd[pid].variants[pvId])byProd[pid].variants[pvId]={size:size,lines:[]};
            byProd[pid].variants[pvId].lines.push(r);
            (window.__recipeVarLines[pvId]=window.__recipeVarLines[pvId]||[]).push({ingredientID:r.ingredientID,productVarientID:pvId});
        });
        var lbl=function(s){return SIZE_LABELS[s]||s;};
        var html='';
        Object.keys(byProd).forEach(function(pid){
            var g=byProd[pid];
            var pvIds=Object.keys(g.variants).sort(function(a,b){return SIZE_ORDER.indexOf(g.variants[a].size)-SIZE_ORDER.indexOf(g.variants[b].size);});
            var firstPv=pvIds[0];
            var sizeOpts=pvIds.map(function(pvId){var v=g.variants[pvId];return '<option value="'+pvId+'">'+lbl(v.size)+' ('+v.lines.length+' nguyên liệu)</option>';}).join('');
            html+='<tr class="recipe-grp-row" style="background:#f7f7f9">'+
                '<td colspan="4" style="font-weight:700">'+g.name+
                    ' &nbsp;<select class="form-control recipe-size-sel" data-prod="'+pid+'" onchange="onRecipeSizeChange(this)" style="display:inline-block;width:auto;height:30px;padding:2px 6px;font-size:12px;vertical-align:middle">'+sizeOpts+'</select>'+
                '</td>'+
                '<td><button class="btn-del" title="Xoá cả công thức của size đang chọn" onclick="deleteSelectedVariantRecipe(this)"><i class="ti-trash"></i></button></td>'+
                '</tr>';
            pvIds.forEach(function(pvId){
                g.variants[pvId].lines.forEach(function(r){
                    var ingName=(r.ingredient)?r.ingredient.ingredientName:'#'+r.ingredientID;
                    var unit=(r.ingredient)?r.ingredient.ingredientUnit:'';
                    html+='<tr class="recipe-line-row" data-prod="'+pid+'" data-pv="'+pvId+'"'+(pvId===firstPv?'':' style="display:none"')+'>'+
                        '<td style="padding-left:22px;color:var(--muted);font-size:12px">↳ '+lbl(g.variants[pvId].size)+'</td>'+
                        '<td>'+ingName+'</td>'+
                        '<td style="font-weight:700">'+(r.qtyBeforeProcess||0)+' → '+(r.qtyAfterProcess||0)+'</td>'+
                        '<td>'+unit+'</td>'+
                        '<td>'+eBtn('btn-del','ti-trash',"crudDelete('recipe','"+r.ingredientID+"/"+pvId+"')")+'</td></tr>';
                });
            });
        });
        t.innerHTML=html;
    }).catch(function(){t.innerHTML='<tr><td colspan="5" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

// Đổi size trong dropdown công thức: chỉ hiện các dòng nguyên liệu của biến thể đó.
window.onRecipeSizeChange=function(sel){
    var pid=sel.getAttribute('data-prod');
    var pv=sel.value;
    document.querySelectorAll('.recipe-line-row[data-prod="'+pid+'"]').forEach(function(row){
        row.style.display=(row.getAttribute('data-pv')===pv)?'':'none';
    });
};

// Xoá toàn bộ công thức (mọi nguyên liệu) của size đang chọn trong nhóm sản phẩm.
window.deleteSelectedVariantRecipe=function(btn){
    var grpRow=btn.closest('tr');
    var sel=grpRow?grpRow.querySelector('.recipe-size-sel'):null;
    if(!sel||!sel.value){showToast('Không có công thức để xoá','warning');return;}
    var pvId=sel.value;
    var lines=(window.__recipeVarLines&&window.__recipeVarLines[pvId])||[];
    if(!lines.length){showToast('Không có công thức để xoá','warning');return;}
    var label=sel.options[sel.selectedIndex].text;
    showConfirm({type:'error',danger:true,title:'Xoá công thức',message:'Xoá toàn bộ công thức của "'+label+'" ('+lines.length+' nguyên liệu)?',confirmText:'Xoá'}).then(function(ok){
        if(!ok)return;
        Promise.all(lines.map(function(l){return apiDelete('/recipe/Delete/'+l.ingredientID+'/'+l.productVarientID);}))
            .then(function(){showPopup({type:'success',message:'Đã xoá công thức của size'});renderRecipes();})
            .catch(function(){showPopup({type:'error',message:'Xoá công thức thất bại'});renderRecipes();});
    });
};

function renderSupps(){
    var t=document.getElementById('supplier-tbody');if(!t)return;
    t.innerHTML='<tr><td colspan="7" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/supplier/get-all').then(function(r){return r.json();}).then(function(data){
        SUPPS_DATA=data||[];
        if(!SUPPS_DATA.length){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Chưa có NCC</td></tr>';return;}
        t.innerHTML=SUPPS_DATA.map(function(s,i){
            return '<tr><td>'+(i+1)+'</td><td style="font-weight:700">'+(s.supplierName||'')+'</td>'+
                   '<td>'+(s.taxCode||'—')+'</td><td>'+(s.phone||'')+'</td><td>'+(s.email||'')+'</td>'+
                   '<td style="font-size:12px">'+(s.ingredientIDs||[]).length+' nguyên liệu</td>'+
                   '<td>'+eBtn('btn-edit','ti-pencil',"crudEdit('supplier','"+s.supplierID+"')")+eBtn('btn-del','ti-trash',"crudDelete('supplier','"+s.supplierID+"')")+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="7" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

var poFilter='pending'; // khớp tab "Chờ Duyệt" đang active trong admin.html
// camelCase của .NET hạ cả cụm viết hoa đầu: POID->poid, POStatus->poStatus,
// PODetail->poDetail, POApproval->poApproval. Đọc kèm fallback cho chắc.
function poId(p){return (p&&(p.poid||p.pOID||p.poID||p.id))||'';}
function poApprovals(p){return (p&&(p.poApproval||p.pOApproval))||[];}
function poDetails(p){return (p&&(p.poDetail||p.pODetail))||[];}
// BE trả về tất cả approval (không sắp xếp) -> tự lấy bản mới nhất theo lastUpdated.
function latestApproval(p){
    var a=poApprovals(p).slice();
    if(!a.length)return null;
    a.sort(function(x,y){return new Date(y.lastUpdated||0)-new Date(x.lastUpdated||0);});
    return a[0];
}
function poStatusOf(p){
    var a=latestApproval(p);
    return a?(a.poStatus||a.pOStatus||'Submitted'):'Submitted';
}
function poStatusInfo(st){
    st=(st||'').toLowerCase();
    if(st==='ordered')   return {cls:'badge-approved',tx:'Đã duyệt'};
    if(st==='received')  return {cls:'badge-paid',tx:'Đã nhận hàng'};
    if(st==='rejected')  return {cls:'badge-rejected',tx:'Từ chối'};
    if(st==='cancelled') return {cls:'badge-rejected',tx:'Đã huỷ'};
    return {cls:'badge-pending',tx:'Chờ duyệt'}; // submitted
}
function poMatchesFilter(st){
    st=(st||'').toLowerCase();
    if(poFilter==='all')      return true;
    if(poFilter==='pending')  return st==='submitted';
    if(poFilter==='approved') return st==='ordered'||st==='received';
    if(poFilter==='rejected') return st==='rejected'||st==='cancelled';
    return true;
}
function renderPO(){
    var t=document.getElementById('po-tbody');if(!t)return;
    t.innerHTML='<tr><td colspan="8" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/purchaseorder/Get-all/'+yearRange()+(ADMIN_STORE_ID?('?storeID='+ADMIN_STORE_ID):'')).then(function(r){return r.ok?r.json():[];}).then(function(data){
        POS_DATA=data||[];
        var rows=POS_DATA.filter(function(p){return poMatchesFilter(poStatusOf(p));});
        var pc=POS_DATA.filter(function(p){return poStatusOf(p).toLowerCase()==='submitted';}).length;
        var b=document.getElementById('badge-po');if(b){b.textContent=pc;b.style.display=pc>0?'inline-block':'none';}
        if(!rows.length){t.innerHTML='<tr><td colspan="8" class="tbl-empty">Không có đơn nào</td></tr>';return;}
        t.innerHTML=rows.map(function(p){
            var id=poId(p);
            var st=poStatusOf(p), si=poStatusInfo(st);
            var appr=latestApproval(p)||{};
            // Lấy thời gian yêu cầu: ưu tiên approval đầu tiên (Submitted), fallback sang latest
            var allApprs=poApprovals(p).slice().sort(function(x,y){return new Date(x.lastUpdated||0)-new Date(y.lastUpdated||0);});
            var firstAppr=allApprs.length?allApprs[0]:appr;
            var reqTime=firstAppr.lastUpdated?new Date(firstAppr.lastUpdated):null;
            var reqTimeStr=reqTime?reqTime.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
            var proposer=appr.employee?appr.employee.fullName:'—';
            var ac=st.toLowerCase()==='submitted'?
                eBtn('btn-approve','ti-check',"event.stopPropagation();actionPO('"+id+"','Ordered')")+' '+eBtn('btn-reject','ti-close',"event.stopPropagation();actionPO('"+id+"','Rejected')"):
                '<span style="color:#aaa;font-size:12px">Đã chốt</span>';
            return '<tr style="cursor:pointer" onclick="openPODetail(\''+id+'\')" title="Bấm để xem chi tiết">'+
                   '<td style="font-weight:700;color:var(--primary);font-family:monospace">'+id.toString().slice(0,8).toUpperCase()+'</td>'+
                   '<td>'+(p.store?p.store.storeName:p.storeID)+'</td>'+
                   '<td style="font-weight:600">'+(p.supplier?p.supplier.supplierName:p.supplierID)+'</td>'+
                   '<td style="font-size:12px;white-space:nowrap">'+reqTimeStr+'</td>'+
                   '<td style="font-weight:700;color:var(--primary)">'+fv(p.total)+' đ</td>'+
                   '<td>'+proposer+'</td>'+
                   '<td>'+bdg(si.cls,si.tx)+'</td><td>'+ac+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="8" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

// Cập nhật badge "Phê Duyệt Đơn Mua" mà không cần mở tab (gọi lúc load trang).
function refreshPOBadge(){
    var b=document.getElementById('badge-po');if(!b)return;
    apiGet('/purchaseorder/Get-all/'+yearRange()+(ADMIN_STORE_ID?('?storeID='+ADMIN_STORE_ID):'')).then(function(r){return r.ok?r.json():[];}).then(function(data){
        var pc=(data||[]).filter(function(p){return poStatusOf(p).toLowerCase()==='submitted';}).length;
        b.textContent=pc;b.style.display=pc>0?'inline-block':'none';
    }).catch(function(){b.style.display='none';});
}

window.actionPO=function(id,status){
    var empId=localStorage.getItem('employeeId')||'00000000-0000-0000-0000-000000000000';
    apiPut('/purchaseorder/update/'+id,{EmployeeID:empId,POStatus:status,Comment:''})
        .then(function(r){
            if(r.ok){
                if(status==='Rejected'){
                    showPopup({type:'success',title:'Đã từ chối',message:'Đã từ chối đơn.'});
                    renderPO();
                } else {
                    // Đã duyệt PO -> nhảy về mục "Phiếu Nhập" để theo dõi danh sách phiếu nhập.
                    showPopup({type:'success',title:'Đã duyệt',message:'Đã duyệt đơn.'});
                    showSection('receipts');
                }
            }
            else{r.json().then(function(d){showToast(d.message||'Thao tác thất bại','error');}).catch(function(){showToast('Thao tác thất bại','error');});}
        }).catch(function(){showToast('Lỗi kết nối','error');});
};
function docTienVND(n){
    if(!n||n===0)return'Không đồng.';
    var d=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
    function g3(num,lead){
        var h=Math.floor(num/100),t=Math.floor((num%100)/10),u=num%10,s='';
        if(lead||h){s+=d[h]+' trăm';if(!t&&u)s+=' lẻ';}
        if(t>1){s+=' '+d[t]+' mươi';if(u===1)s+=' mốt';else if(u===5)s+=' lăm';else if(u)s+=' '+d[u];}
        else if(t===1){s+=' mười';if(u===5)s+=' lăm';else if(u)s+=' '+d[u];}
        else if(u)s+=' '+d[u];
        return s.trim();
    }
    var units=['', ' nghìn', ' triệu', ' tỷ'];
    var groups=[],tmp=n;
    while(tmp>0){groups.unshift(tmp%1000);tmp=Math.floor(tmp/1000);}
    var res='';
    for(var i=0;i<groups.length;i++){if(groups[i])res+=g3(groups[i],i>0)+units[groups.length-1-i]+' ';}
    res=res.trim().replace(/\s+/g,' ')+' đồng.';
    return res.charAt(0).toUpperCase()+res.slice(1);
}
function printPOA4(p){
    var apv=latestApproval(p);
    var dateStr=apv?(apv.lastUpdated||'').toString().slice(0,10):'';
    var pid=p.poid||p.pOID||'';
    var storeName=(p.store&&p.store.storeName)?p.store.storeName:'Chônlibi';
    var suppName=(p.supplier&&p.supplier.supplierName)?p.supplier.supplierName:(p.supplierID||'');
    var empName=(p.employee&&(p.employee.employeeName||p.employee.fullName))?(p.employee.employeeName||p.employee.fullName):'';
    var details=p.poDetail||p.pODetail||[];
    var tong=details.reduce(function(s,d){return s+(d.quantity||0)*(d.unitPriceExpected||0);},0);
    var day=dateStr?dateStr.slice(8,10):'.....';
    var mon=dateStr?dateStr.slice(5,7):'.....';
    var yr=dateStr?dateStr.slice(0,4):'20.....';
    var rowsHtml=details.map(function(d,i){
        var ing=d.ingredient||d.Ingredient||{};
        var name=ing.ingredientName||ing.IngredientName||('Mã '+d.ingredientID);
        var unit=ing.ingredientUnit||ing.IngredientUnit||'';
        var qty=d.quantity||0;
        var price=d.unitPriceExpected||0;
        var sub=qty*price;
        var maSo=(d.ingredientID||'').toString().slice(0,6).toUpperCase()||('NL'+String(i+1).padStart(2,'0'));
        return '<tr><td class="c">'+(i+1)+'</td><td>'+name+'</td>'
            +'<td class="c">'+maSo+'</td>'
            +'<td class="c">'+unit+'</td>'
            +'<td class="r">'+qty.toLocaleString('vi-VN')+'</td>'
            +'<td class="r">'+qty.toLocaleString('vi-VN')+'</td>'
            +'<td class="r">'+price.toLocaleString('vi-VN')+'</td>'
            +'<td class="r">'+sub.toLocaleString('vi-VN')+'</td></tr>';
    }).join('');
    for(var k=0;k<3;k++)rowsHtml+='<tr class="empty"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    var html='<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">'
        +'<title>Phiếu Nhập Kho - '+pid.slice(0,8).toUpperCase()+'</title>'
        +'<style>'
        +':root{--ink:#111;--line:#000;}*{box-sizing:border-box;}'
        +'body{margin:0;background:#e9eaec;font-family:"Times New Roman",Times,serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
        +'.toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:center;gap:12px;padding:12px;background:#1f2937;}'
        +'.toolbar button{font-family:system-ui,sans-serif;font-size:14px;font-weight:600;padding:8px 18px;border:0;border-radius:8px;cursor:pointer;background:#E8590C;color:#fff;}'
        +'.toolbar .hint{color:#cbd5e1;font-family:system-ui,sans-serif;font-size:12px;align-self:center;}'
        +'.sheet{width:210mm;min-height:297mm;margin:16px auto;padding:14mm 16mm;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.18);font-size:13.5pt;line-height:1.45;}'
        +'.head{display:flex;justify-content:space-between;align-items:flex-start;}'
        +'.head .left{width:48%;}.head .right{width:48%;text-align:right;}'
        +'.mau{font-weight:700;}.tt{font-style:italic;font-size:11.5pt;line-height:1.3;}'
        +'.title{text-align:center;margin:14px 0 2px;}'
        +'.title h1{font-size:18pt;font-weight:700;letter-spacing:1px;margin:0;text-transform:uppercase;}'
        +'.title .date{font-style:italic;font-size:12.5pt;}'
        +'.nocc{display:flex;justify-content:center;gap:34px;font-size:12.5pt;margin-bottom:8px;}'
        +'.meta p{margin:4px 0;}.fill{border-bottom:1px dotted #555;}'
        +'table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12.5pt;}'
        +'th,td{border:1px solid var(--line);padding:4px 6px;vertical-align:middle;}'
        +'th{text-align:center;font-weight:700;}'
        +'.c{text-align:center;}.r{text-align:right;}'
        +'.codes td{text-align:center;font-style:italic;font-size:11pt;padding:2px;}'
        +'.empty td{height:26px;}.sum td{font-weight:700;}'
        +'.total-words{margin:6px 0;}'
        +'.sign-wrap{margin-top:14px;page-break-inside:avoid;}'
        +'.sign-date{text-align:right;font-style:italic;font-size:12.5pt;margin-right:6%;margin-bottom:6px;}'
        +'.signs{display:flex;justify-content:space-between;text-align:center;}'
        +'.signs .col{width:24%;}.signs .role{font-weight:700;font-size:12.5pt;}'
        +'.signs .sub{font-style:italic;font-size:11pt;}.signs .space{height:70px;}.signs .name{font-weight:600;}'
        +'.note{font-style:italic;font-size:10.5pt;color:#333;margin-top:16px;border-top:1px solid #999;padding-top:6px;}'
        +'@media print{@page{size:A4;margin:12mm;}body{background:#fff;}.toolbar{display:none;}'
        +'.sheet{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none;}.note{color:#000;}}'
        +'</style></head><body>'
        +'<div class="toolbar"><button onclick="window.print()">🖨️ In phiếu (A4)</button>'
        +'<span class="hint">Mẹo: trong hộp thoại in, chọn "Lưu thành PDF" để xuất file.</span></div>'
        +'<div class="sheet">'
        +'<div class="head"><div class="left">'
        +'<p style="margin:2px 0">Đơn vị: <b>'+storeName+'</b></p>'
        +'<p style="margin:2px 0">Bộ phận: <span class="fill">Kho nguyên liệu</span></p>'
        +'</div><div class="right">'
        +'<p class="mau" style="margin:2px 0">Mẫu số: 01 - VT</p>'
        +'<p class="tt" style="margin:2px 0">(Kèm theo Thông tư số 99/2025/TT-BTC<br>ngày 27 tháng 10 năm 2025 của<br>Bộ trưởng Bộ Tài chính)</p>'
        +'</div></div>'
        +'<div class="title"><h1>Phiếu Nhập Kho</h1>'
        +'<div class="date">Ngày '+day+' tháng '+mon+' năm '+yr+'</div></div>'
        +'<div class="nocc"><span>Số: <b>'+pid.slice(0,8).toUpperCase()+'</b></span>'
        +'<span>Nợ: <span class="fill">.............</span></span>'
        +'<span>Có: <span class="fill">.............</span></span></div>'
        +'<div class="meta">'
        +'<p>- Họ và tên người giao: <b>'+suppName+'</b></p>'
        +'<p>- Theo đơn đặt hàng số <b>'+pid.slice(0,8).toUpperCase()+'</b> ngày '+day+' tháng '+mon+' năm '+yr+' của <span class="fill">'+suppName+'</span></p>'
        +'<p>- Nhập tại kho: <b>Kho nguyên liệu</b> &nbsp;&nbsp; Địa điểm: <span class="fill">'+storeName+'</span></p>'
        +'</div>'
        +'<table><thead>'
        +'<tr><th rowspan="2" style="width:5%">STT</th>'
        +'<th rowspan="2">Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hóa</th>'
        +'<th rowspan="2" style="width:8%">Mã số</th>'
        +'<th rowspan="2" style="width:9%">Đơn vị tính</th>'
        +'<th colspan="2" style="width:18%">Số lượng</th>'
        +'<th rowspan="2" style="width:13%">Đơn giá</th>'
        +'<th rowspan="2" style="width:16%">Thành tiền</th></tr>'
        +'<tr><th style="width:9%">Theo chứng từ</th><th style="width:9%">Thực nhập</th></tr>'
        +'<tr class="codes"><td>A</td><td>B</td><td>C</td><td>D</td><td>1</td><td>2</td><td>3</td><td>4</td></tr>'
        +'</thead><tbody>'+rowsHtml+'</tbody>'
        +'<tfoot><tr class="sum"><td class="c"></td><td><b>Cộng</b></td>'
        +'<td class="c">x</td><td class="c">x</td><td class="c">x</td><td class="c">x</td><td class="c">x</td>'
        +'<td class="r">'+tong.toLocaleString('vi-VN')+'</td></tr></tfoot>'
        +'</table>'
        +'<div class="total-words">- Tổng số tiền (viết bằng chữ): <i>'+docTienVND(tong)+'</i></div>'
        +'<div style="margin:4px 0 0">- Số chứng từ gốc kèm theo: <span class="fill">................................</span></div>'
        +'<div class="sign-wrap">'
        +'<div class="sign-date">TP. HCM, ngày '+day+' tháng '+mon+' năm '+yr+'</div>'
        +'<div class="signs">'
        +'<div class="col"><div class="role">Người lập phiếu</div><div class="sub">(Ký, họ tên)</div>'
        +'<div class="space"></div>'+(empName?'<div class="name">'+empName+'</div>':'')+'</div>'
        +'<div class="col"><div class="role">Người giao hàng</div><div class="sub">(Ký, họ tên)</div><div class="space"></div></div>'
        +'<div class="col"><div class="role">Thủ kho</div><div class="sub">(Ký, họ tên)</div><div class="space"></div></div>'
        +'<div class="col"><div class="role">Kế toán trưởng</div><div class="sub">(Hoặc bộ phận có nhu cầu nhập)<br>(Ký, họ tên)</div><div class="space"></div></div>'
        +'</div></div>'
        +'<div class="note">Ghi chú: Tùy theo đặc điểm hoạt động sản xuất kinh doanh và yêu cầu quản lý của đơn vị mình, doanh nghiệp được xây dựng, thiết kế biểu mẫu chứng từ kế toán.</div>'
        +'</div></body></html>';
    var win=window.open('','_blank','width=920,height=750');
    if(win){win.document.write(html);win.document.close();}
}
window.openPODetail=function(id){
    document.getElementById('modal-box').style.maxWidth='700px';
    document.getElementById('modal-title').textContent='Chi Tiết Đơn Mua Hàng';
    document.getElementById('modal-body').innerHTML='<div style="text-align:center;padding:32px;color:var(--muted)">Đang tải...</div>';
    document.getElementById('modal-confirm').style.display='none';
    document.getElementById('modal-cancel').textContent='Đóng';
    mOv.classList.add('open');
    apiGet('/purchaseorder/get/'+id)
        .then(function(r){return r.ok?r.json():null;})
        .then(function(p){
            if(!p){document.getElementById('modal-body').innerHTML='<div style="color:var(--red);padding:20px">Không tìm thấy đơn.</div>';return;}
            var apv=latestApproval(p);
            var st=apv?(apv.poStatus||apv.pOStatus||'submitted').toLowerCase():'submitted';
            var stMap={
                submitted:{label:'Chờ duyệt',color:'#B45309',bg:'#FFFBEB',border:'#FDE68A'},
                ordered:{label:'Đã duyệt',color:'#047857',bg:'#ECFDF5',border:'#A7F3D0'},
                received:{label:'Đã nhận hàng',color:'#047857',bg:'#ECFDF5',border:'#A7F3D0'},
                rejected:{label:'Từ chối',color:'#DC2626',bg:'#FEE2E2',border:'#FECACA'},
                cancelled:{label:'Đã hủy',color:'#6B7280',bg:'#F3F4F6',border:'#D1D5DB'}
            };
            var si=stMap[st]||{label:st,color:'#6B7280',bg:'#F3F4F6',border:'#D1D5DB'};
            var dateStr=apv?(apv.lastUpdated||'').toString().slice(0,10):'';
            var pid=p.poid||p.pOID||id;
            var storeName=(p.store&&p.store.storeName)?p.store.storeName:(p.storeID||'—');
            var suppName=(p.supplier&&p.supplier.supplierName)?p.supplier.supplierName:(p.supplierID||'—');
            var allApvs=p.pOApproval||p.poApproval||[];
            var firstApv=allApvs.length?allApvs[allApvs.length-1]:null;
            var empName=(firstApv&&firstApv.employee&&(firstApv.employee.fullName||firstApv.employee.employeeName))
                ?(firstApv.employee.fullName||firstApv.employee.employeeName):'—';
            var details=p.poDetail||p.pODetail||[];
            var tong=details.reduce(function(s,d){return s+(d.quantity||0)*(d.unitPriceExpected||0);},0);
            var svgStore='<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
            var svgTruck='<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>';
            var svgHash='<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>';
            var svgUser='<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
            function mc(icon,lbl,val){
                return '<div style="display:flex;align-items:flex-start;gap:10px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px 14px">'
                    +'<div style="width:30px;height:30px;border-radius:8px;background:#FFF4ED;color:#E8590C;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">'+icon+'</div>'
                    +'<div style="min-width:0">'
                    +'<div style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#94A3B8;margin-bottom:2px">'+lbl+'</div>'
                    +'<div style="font-size:13px;font-weight:600;color:#1E293B;word-break:break-word">'+val+'</div>'
                    +'</div></div>';
            }
            var rowsHtml=details.length?details.map(function(d){
                var ing=d.ingredient||d.Ingredient||{};
                var name=ing.ingredientName||ing.IngredientName||('Mã '+d.ingredientID);
                var unit=ing.ingredientUnit||ing.IngredientUnit||'';
                var qty=d.quantity||0;
                var price=d.unitPriceExpected||0;
                var sub=qty*price;
                return '<tr style="border-top:1px solid #F1F5F9">'
                    +'<td style="padding:10px 14px;font-weight:600;color:#1E293B;font-size:13px">'+name+'</td>'
                    +'<td style="padding:10px 14px;text-align:center;font-size:12px;color:#64748B">'+unit+'</td>'
                    +'<td style="padding:10px 14px;text-align:right;font-weight:600;color:#1E293B;font-size:13px">'+fv(qty)+'</td>'
                    +'<td style="padding:10px 14px;text-align:right;color:#64748B;font-size:13px">'+fv(price)+' đ</td>'
                    +'<td style="padding:10px 14px;text-align:right;font-weight:700;color:#E8590C;font-size:13px">'+fv(sub)+' đ</td>'
                    +'</tr>';
            }).join(''):'<tr><td colspan="5" style="padding:24px;text-align:center;color:#94A3B8">Không có nguyên liệu</td></tr>';
            document.getElementById('modal-title').innerHTML=
                'Chi Tiết Đơn Mua Hàng '
                +'<span style="background:#E8590C;color:#fff;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:700;font-family:monospace;vertical-align:middle">#'+pid.slice(0,8).toUpperCase()+'</span>';
            document.getElementById('modal-body').innerHTML=
                '<div style="background:#FFF4ED;border-radius:10px;padding:14px 16px;margin-bottom:14px;border:1px solid #FDDCBA;position:relative;overflow:hidden">'
                +'<div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#E8590C,#FB923C)"></div>'
                +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
                +'<span style="background:'+si.bg+';color:'+si.color+';border:1px solid '+si.border+';border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">● '+si.label+'</span>'
                +(dateStr?'<span style="font-size:12px;color:#94A3B8;margin-left:auto">Ngày: '+dateStr+'</span>':'')
                +'</div></div>'
                +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'
                +mc(svgStore,'Chi nhánh',storeName)
                +mc(svgTruck,'Nhà cung cấp',suppName)
                +mc(svgHash,'Mã đơn PO','PO #'+pid.slice(0,8).toUpperCase())
                +mc(svgUser,'Người đề xuất',empName)
                +'</div>'
                +'<div style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:12px">'
                +'<table style="width:100%;border-collapse:collapse">'
                +'<thead><tr style="background:#F8FAFC">'
                +'<th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.04em">Nguyên liệu</th>'
                +'<th style="padding:9px 14px;text-align:center;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.04em">ĐVT</th>'
                +'<th style="padding:9px 14px;text-align:right;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.04em">Số lượng</th>'
                +'<th style="padding:9px 14px;text-align:right;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.04em">Đơn giá</th>'
                +'<th style="padding:9px 14px;text-align:right;font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.04em">Thành tiền</th>'
                +'</tr></thead>'
                +'<tbody>'+rowsHtml+'</tbody>'
                +'<tfoot><tr style="border-top:2px solid #E2E8F0;background:#FFF9F6">'
                +'<td colspan="4" style="padding:11px 14px;font-weight:700;color:#1E293B;font-size:13px">Cộng</td>'
                +'<td style="padding:11px 14px;text-align:right;font-weight:800;color:#E8590C;font-size:15px">'+fv(tong)+' đ</td>'
                +'</tr></tfoot>'
                +'</table></div>'
                +'<div style="font-size:12px;color:#64748B;font-style:italic">'
                +'Số tiền bằng chữ: <span style="color:#1E293B;font-style:normal;font-weight:600">'+docTienVND(tong)+'</span>'
                +'</div>';
            // Note trạng thái kế tiếp
            var nextStepNote = '';
            if (st === 'ordered') {
                nextStepNote = '<div style="margin-top:10px;padding:10px 14px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;font-size:12px;color:#1D4ED8;display:flex;align-items:center;gap:8px">'
                    +'<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                    +'<span><strong>Bước tiếp theo:</strong> Nhân viên vào <em>Nhập Kho</em> → chọn PO này → tạo và xác nhận phiếu nhập để cập nhật kho.</span></div>';
            } else if (st === 'submitted') {
                nextStepNote = '<div style="margin-top:10px;padding:10px 14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;font-size:12px;color:#B45309;display:flex;align-items:center;gap:8px">'
                    +'<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z"/></svg>'
                    +'<span>Đơn đang chờ duyệt. Dùng nút <strong>Duyệt / Từ chối</strong> trong bảng danh sách.</span></div>';
            }
            var existBody = document.getElementById('modal-body').innerHTML;
            document.getElementById('modal-body').innerHTML = existBody + nextStepNote;

            document.getElementById('modal-confirm').style.display='none';
        })
        .catch(function(){document.getElementById('modal-body').innerHTML='<div style="color:var(--red);padding:20px">Lỗi tải chi tiết đơn.</div>';});
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

// Nhãn + class badge trạng thái cho 1 lô (dùng chung cho bảng lô chi tiết).
function batchStatusBadge(b){
    var ds=batchDS(b),sCls,sTx;
    if(ds==='Available'){sCls='badge-ok';sTx='Còn Hàng';}
    else if(ds==='expiring'){sCls='badge-expiring';sTx='Sắp Hết Hạn';}
    else if(ds==='Expired'){sCls='badge-expired';sTx='Hết Hạn';}
    else if(ds==='Depleted'){sCls='badge-inactive';sTx='Hết Hàng';}
    else if(ds==='Damaged'){sCls='badge-rejected';sTx='Hỏng';}
    else if(ds==='Locked'){sCls='badge-pending';sTx='Khóa';}
    else{sCls='badge-inactive';sTx=ds;}
    return bdg(sCls,sTx);
}

function renderIngSummary(){
    var t=document.getElementById('ing-summary-tbody');if(!t)return;
    var ingMap={};
    BATCHES_DATA.forEach(function(b){
        if(!b.ingredient)return;
        var k=b.ingredientID;
        if(!ingMap[k])ingMap[k]={name:b.ingredient.ingredientName,unit:b.ingredient.ingredientUnit,qty:0,cnt:0,expCnt:0,batches:[]};
        ingMap[k].batches.push(b);
        if(b.status==='Available'&&b.quantityOnHand>0){ingMap[k].qty+=b.quantityOnHand;ingMap[k].cnt++;if(isBatchExpiring(b))ingMap[k].expCnt++;}
    });
    var keys=Object.keys(ingMap);
    if(!keys.length){t.innerHTML='<tr><td colspan="5" class="tbl-empty">Không có nguyên liệu nào trong kho</td></tr>';return;}
    t.innerHTML=keys.sort(function(a,b){return ingMap[b].qty-ingMap[a].qty;}).map(function(k){
        var ig=ingMap[k];
        var expHtml=ig.expCnt>0?bdg('badge-expiring',ig.expCnt+' sắp hết hạn'):'<span style="color:var(--muted)">—</span>';
        // FIFO: lô nhập trước lên đầu, giống bảng lô hàng bên dưới.
        var batches=ig.batches.slice().sort(function(a,b){return new Date(a.importDate)-new Date(b.importDate);});
        var rowsHtml=batches.map(function(b){
            var qtyCol=fv(b.quantityOnHand)+' / '+fv(b.quantityOriginal);
            var expSt=(batchDS(b)==='Expired'||batchDS(b)==='expiring')?'color:var(--red);font-weight:700':'';
            var typeTx=b.batchType==='Raw'?'Thô':'Sơ Chế';
            return '<tr>'+
                '<td style="font-family:monospace;font-weight:700;color:var(--primary)">'+(b.batchCode||b.batchID.toString().slice(0,8).toUpperCase())+'</td>'+
                '<td>'+typeTx+'</td>'+
                '<td>Kho #'+b.warehouseID+'</td>'+
                '<td style="text-align:right;font-weight:700">'+qtyCol+'</td>'+
                '<td style="text-align:right">'+fv(b.unitCost)+' đ</td>'+
                '<td>'+fmtVnDate(b.importDate)+'</td>'+
                '<td style="'+expSt+'">'+(b.exp?fmtVnDate(b.exp):'—')+'</td>'+
                '<td>'+batchStatusBadge(b)+'</td>'+
            '</tr>';
        }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:14px">Không có lô nào</td></tr>';
        return '<tr class="ing-grp-row" onclick="toggleMovGroupDetail(this)" style="cursor:pointer">'+
            '<td style="font-weight:700"><span class="toggle-icon" style="display:inline-block;transition:transform .2s ease;color:var(--primary);margin-right:6px"><i class="ti-angle-right"></i></span>'+ig.name+'</td>'+
            '<td style="color:var(--muted)">'+ig.unit+'</td>'+
            '<td style="font-weight:800;font-size:17px;color:var(--primary)">'+fv(ig.qty)+'</td>'+
            '<td>'+bdg('badge-ok',ig.cnt+' lô')+'</td>'+
            '<td>'+expHtml+'</td>'+
        '</tr>'+
        '<tr class="detail-row" style="display:none;background:#fcfcfc">'+
            '<td colspan="5" style="padding:10px 20px">'+
                '<div style="border:1px solid #eee;border-radius:8px;background:#fff;overflow:hidden;padding:12px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">'+
                    '<div style="font-weight:700;font-size:12px;color:#555;margin-bottom:8px"><i class="ti-layers"></i> Các lô của "'+ig.name+'" — '+batches.length+' lô (FIFO)</div>'+
                    '<table class="nested-movement-table" style="width:100%;border-collapse:collapse;font-size:12.5px">'+
                        '<thead><tr>'+
                            '<th style="text-align:left">Mã Lô</th>'+
                            '<th style="text-align:left">Loại</th>'+
                            '<th style="text-align:left">Kho</th>'+
                            '<th style="text-align:right">SL Còn / Ban Đầu</th>'+
                            '<th style="text-align:right">Giá Vốn</th>'+
                            '<th style="text-align:left">Ngày Nhập</th>'+
                            '<th style="text-align:left">HSD</th>'+
                            '<th style="text-align:left">Trạng Thái</th>'+
                        '</tr></thead>'+
                        '<tbody>'+rowsHtml+'</tbody>'+
                    '</table>'+
                '</div>'+
            '</td>'+
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
            '<td style="font-size:12px;font-weight:600">'+fmtVnDate(b.importDate)+'</td>'+
            '<td style="font-size:12px;color:var(--muted)">'+fmtVnDate(b.mfd)+'</td>'+
            '<td style="font-size:12px;'+expSt+'">'+fmtVnDate(b.exp)+'</td>'+
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
                else shiftName='Ca Chiều';
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

// ===== BÁO CÁO DOANH THU =====
var _reportInit=false;
// Tính khoảng ngày theo kỳ (today/week/month) dựa trên hôm nay (giờ VN).
function reportRange(period){
    var iso=vnTodayISO(); var p=iso.split('-'), y=+p[0], m=+p[1], dd=+p[2];
    if(period==='today') return {start:iso, end:iso};
    if(period==='month') return {start:y+'-'+String(m).padStart(2,'0')+'-01', end:iso};
    // 'week' = từ Thứ Hai đến hôm nay
    var u=new Date(Date.UTC(y,m-1,dd)), dow=u.getUTCDay(); // 0=CN..6=T7
    u.setUTCDate(u.getUTCDate()-(dow===0?6:dow-1));
    return {start:u.toISOString().slice(0,10), end:iso};
}
function payMethodVN(m){m=(m||'').toLowerCase();return m==='cash'?'Tiền mặt':(m==='banktransfer'?'Chuyển khoản':(m==='card'?'Thẻ':(m||'—')));}
function payStatusInfo(s){s=(s||'').toLowerCase();if(s==='paid')return{cls:'badge-paid',tx:'Đã thanh toán'};if(s==='failed')return{cls:'badge-rejected',tx:'Thất bại'};return{cls:'badge-pending',tx:'Chờ thanh toán'};}
// Nạp danh sách chi nhánh vào dropdown + gắn sự kiện đổi bộ lọc (chỉ 1 lần).
function initReports(){
    if(_reportInit)return; _reportInit=true;
    var sf=document.getElementById('report-store-filter');
    if(sf){
        // Admin chỉ xem báo cáo store của mình ⇒ ẩn bộ lọc chọn chi nhánh.
        if(ADMIN_STORE_ID>0){
            sf.style.display='none';
        }else{
            apiGet('/store/get-all').then(function(r){return r.ok?r.json():[];}).then(function(stores){
                (stores||[]).forEach(function(s){var o=document.createElement('option');o.value=s.storeID;o.textContent=s.storeName;sf.appendChild(o);});
            }).catch(function(){});
            sf.addEventListener('change',renderReports);
        }
    }
    var pf=document.getElementById('report-period');
    if(pf)pf.addEventListener('change',renderReports);
}
function renderReports(){
    var s=document.getElementById('report-stats'),t=document.getElementById('bill-tbody');if(!s||!t)return;
    initReports();
    var period=(document.getElementById('report-period')||{}).value||'week';
    var store=ADMIN_STORE_ID>0?ADMIN_STORE_ID:((document.getElementById('report-store-filter')||{}).value||'all');
    var rg=reportRange(period);
    var path='/bill/get-all/'+rg.start+'/'+rg.end+(store&&store!=='all'?('?storeID='+store):'');
    t.innerHTML='<tr><td colspan="9" class="tbl-empty">Đang tải...</td></tr>';
    apiGet(path).then(function(r){return r.ok?r.json():[];}).then(function(data){
        BILLS_DATA=Array.isArray(data)?data:[];
        var rev=BILLS_DATA.reduce(function(a,b){return a+(b.total||0);},0);
        if(s)s.innerHTML=sc('ti-stats-up','orange',fv(rev)+' đ','Tổng Doanh Thu')+sc('ti-receipt','blue',BILLS_DATA.length,'Tổng Hóa Đơn');
        if(!BILLS_DATA.length){t.innerHTML='<tr><td colspan="9" class="tbl-empty">Không có hóa đơn trong kỳ</td></tr>';return;}
        t.innerHTML=BILLS_DATA.map(function(b){
            var chg=(b.billChange||[]).filter(function(c){return (c.status||'')==='Create';})[0]||(b.billChange||[])[0]||{};
            var emp=chg.employee?chg.employee.fullName:'—';
            var date=(chg.changeAt||'').toString().slice(0,10);
            var ps=payStatusInfo(b.paymentStatus);
            return '<tr>'+
                '<td style="font-weight:700;font-family:monospace">'+(b.billID||'').toString().slice(0,8)+'</td>'+
                '<td>'+(b.store?b.store.storeName:'')+'</td>'+
                '<td>'+emp+'</td>'+
                '<td style="font-weight:700;color:var(--primary)">'+fv(b.total||0)+' đ</td>'+
                '<td>'+fv(b.moneyReceived||0)+' đ</td>'+
                '<td>'+fv(b.moneyGiveBack||0)+' đ</td>'+
                '<td>'+payMethodVN(b.paymentMethods)+'</td>'+
                '<td style="font-size:12px">'+date+'</td>'+
                '<td>'+bdg(ps.cls,ps.tx)+'</td></tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="9" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}

var _smStoreInit = false;
function initSmStoreFilter() {
    if (_smStoreInit) return;
    _smStoreInit = true;
    var sf = document.getElementById('sm-store-filter');
    if (sf) {
        if (ADMIN_STORE_ID > 0) {
            sf.style.display = 'none';
            return;
        }
        apiGet('/store/get-all').then(function(r){return r.ok?r.json():[];}).then(function(stores){
            (stores||[]).forEach(function(s){
                var o = document.createElement('option');
                o.value = s.storeID;
                o.textContent = s.storeName;
                sf.appendChild(o);
            });
        }).catch(function(){});
        sf.addEventListener('change', renderMovs);
    }
}

window.toggleMovGroupDetail = function(row) {
    row.classList.toggle('expanded');
    var nextRow = row.nextElementSibling;
    if (nextRow && nextRow.classList.contains('detail-row')) {
        nextRow.style.display = nextRow.style.display === 'none' ? 'table-row' : 'none';
    }
    var iconContainer = row.querySelector('.toggle-icon');
    if (iconContainer) {
        if (row.classList.contains('expanded')) {
            iconContainer.style.transform = 'rotate(90deg)';
        } else {
            iconContainer.style.transform = 'rotate(0deg)';
        }
    }
};

function renderMovs(){
    var s=document.getElementById('sm-stats'),t=document.getElementById('sm-tbody');if(!s||!t)return;
    initSmStoreFilter();
    t.innerHTML='<tr><td colspan="5" class="tbl-empty">Đang tải dữ liệu...</td></tr>';
    
    var sf = document.getElementById('sm-store-filter');
    var storeVal = sf ? sf.value : 'all';
    
    var url = '/StockMovement/get-all';
    var targetStore = ADMIN_STORE_ID > 0 ? ADMIN_STORE_ID : (storeVal !== 'all' ? storeVal : null);
    if(targetStore) {
        url += '?storeID=' + targetStore;
    }
    
    apiGet(url)
    .then(function(r){ return r.ok ? r.json() : []; })
    .then(function(data){
        var list = Array.isArray(data) ? data : [];
        var inp = list.filter(function(m){ return m.qtyChange > 0; }).length;
        if(s) s.innerHTML=sc('ti-arrow-down','green',inp,'Lần Nhập Kho')+sc('ti-arrow-up','red',list.length-inp,'Lần Xuất Kho');
        
        if(!list.length) {
            t.innerHTML='<tr><td colspan="5" class="tbl-empty">Không có dữ liệu biến động kho</td></tr>';
            return;
        }
        
        var groups = {};
        list.forEach(function(m) {
            var key = m.ingredientName || ('#' + m.ingredientID) || 'Không tên';
            if (!groups[key]) {
                groups[key] = {
                    name: key,
                    unit: m.ingredientUnit || '',
                    totalUsed: 0,
                    movements: []
                };
            }
            groups[key].movements.push(m);
            if (m.qtyChange < 0) {
                groups[key].totalUsed += Math.abs(m.qtyChange);
            }
        });
        
        var groupList = Object.keys(groups).map(function(k) { return groups[k]; });
        groupList.sort(function(a, b) { return b.totalUsed - a.totalUsed; });
        
        t.innerHTML = groupList.map(function(g, idx) {
            var subRowsHtml = g.movements.map(function(m) {
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
                
                var formattedDate = fmtVnDateTime(m.timeStamp);
                var qtyChangeStr = (m.qtyChange > 0 ? '+' : '') + m.qtyChange;
                var reasonOrNote = m.reason || m.note || '—';
                var empName = m.employeeName || 'Hệ thống';
                
                var detailBtn = '—';
                if (m.referenceID) {
                    detailBtn = '<button class="btn-detail-toggle" onclick="event.stopPropagation(); toggleMovDetails(\'' + m.stockMovementID + '\', \'' + m.referenceType + '\', \'' + m.referenceID + '\', this)">Chi tiết</button>';
                }
                
                return '<tr id="mov-row-' + m.stockMovementID + '">'
                    + '<td>' + formattedDate + '</td>'
                    + '<td style="font-family:monospace;font-size:11px">' + (m.batchCode || '—') + '</td>'
                    + '<td>' + bdg(badgeClass, typeLabel) + '</td>'
                    + '<td style="font-weight:700;text-align:right">' + qtyChangeStr + '</td>'
                    + '<td>' + empName + '</td>'
                    + '<td style="font-size:11px;color:var(--muted)">' + reasonOrNote + '</td>'
                    + '<td style="text-align:center">' + detailBtn + '</td>'
                    + '</tr>'
                    + '<tr class="detail-row" id="detail-row-' + m.stockMovementID + '" style="display:none;">'
                    + '<td colspan="7" style="padding:10px 20px"><div class="mov-detail-content" id="detail-content-' + m.stockMovementID + '">Đang tải chi tiết...</div></td>'
                    + '</tr>';
            }).join('');
            
            var totalUsedStr = fv(g.totalUsed) + ' ' + g.unit;
            var movCountStr = g.movements.length + ' lần';
            
            return '<tr class="mov-group-row" onclick="toggleMovGroupDetail(this)" style="cursor:pointer">'
                + '  <td style="text-align:center;width:50px">'
                + '    <span class="toggle-icon" style="display: inline-block; transition: transform 0.2s ease; color: var(--primary);"><i class="ti-angle-right"></i></span>'
                + '  </td>'
                + '  <td style="font-weight:700;color:var(--primary)">' + g.name + '</td>'
                + '  <td>' + g.unit + '</td>'
                + '  <td style="font-weight:800;color:var(--red);text-align:right;padding-right:24px">' + totalUsedStr + '</td>'
                + '  <td style="text-align:center"><span class="badge badge-inactive">' + movCountStr + '</span></td>'
                + '</tr>'
                + '<tr class="detail-row" style="display:none;background:#fcfcfc">'
                + '  <td colspan="5" style="padding:10px 20px">'
                + '    <div style="border:1px solid #eee;border-radius:8px;background:#fff;overflow:hidden;padding:12px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">'
                + '      <table class="nested-movement-table" style="width:100%;border-collapse:collapse;font-size:12.5px">'
                + '        <thead>'
                + '          <tr style="background:#fafafa;border-bottom:1px solid #eee">'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">Thời Gian</th>'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">Mã Lô</th>'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">Loại Biến Động</th>'
                + '            <th style="padding:8px 12px;text-align:right;color:#666">SL Thay Đổi</th>'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">Nhân Viên</th>'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">Lý Do / Ghi Chú</th>'
                + '            <th style="padding:8px 12px;width:100px;text-align:center">Chi Tiết</th>'
                + '          </tr>'
                + '        </thead>'
                + '        <tbody>' + subRowsHtml + '</tbody>'
                + '      </table>'
                + '    </div>'
                + '  </td>'
                + '</tr>';
        }).join('');
    }).catch(function(err){
        t.innerHTML='<tr><td colspan="5" class="tbl-empty">Lỗi tải dữ liệu: ' + (err.message || '') + '</td></tr>';
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
    document.getElementById('modal-box').style.maxWidth='';
    document.getElementById('modal-title').textContent=title;
    document.getElementById('modal-body').innerHTML=body;
    mOv.classList.add('open');
    var ok=document.getElementById('modal-confirm');
    ok.style.cssText='';
    ok.textContent='Xác Nhận';
    ok.style.display='';
    ok.onclick=onConfirm||function(){closeModal();};
    document.getElementById('modal-cancel').textContent='Huỷ';
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
    if(type==='supplier'){openSupplierModal();return;}
    if(type==='store'){openAddStoreModal();return;}
    openModal('Thêm mới '+type, FORMS[type]||'', function(){
        var ok=false;
        if(type==='product'){
            apiPost('/product/add-product',{ProductName:getV('f-name'),ProductType:getV('f-type'),Image:null})
            .then(function(r){
                if(r.ok){
                    // Sau khi add product, thêm variant mặc định với giá đã nhập
                    return apiGet('/product/get-all').then(function(r2){return r2.json();}).then(function(prods){
                        var last=prods[prods.length-1];
                        if(last&&getV('f-price')){
                            return apiPost('/product/add-varient',{ProductID:last.productID,Size:'Default',Price:parseFloat(getV('f-price'))||0});
                        }
                    }).then(function(){showPopup({type:'success',title:'Thành công',message:'Thêm sản phẩm thành công.'});closeModal();renderProds();});
                } else {showPopup({type:'error',title:'Thêm thất bại',message:'Không thể thêm. Vui lòng thử lại.'});}
            });
        } else if(type==='emp'){
            apiPost('/employee/add',{UserName:getV('f-username'),HashPassword:getV('f-pass'),FullName:getV('f-name'),BirthDate:getV('f-birth')||'2000-01-01',Phone:getV('f-phone'),Email:getV('f-email'),Gender:getV('f-gender'),Role:getV('f-role'),StoreID:parseInt(getV('f-store'))||1,BasicSalary:parseFloat(getV('f-salary'))||0})
            .then(function(r){if(r.ok){showPopup({type:'success',title:'Thành công',message:'Thêm nhân viên thành công.'});closeModal();renderEmps();}else{r.json().then(function(d){showPopup({type:'error',title:'Thêm thất bại',message:d.message||'Không thể thêm nhân viên.'});});}});
        } else if(type==='ticket'){
            apiPost('/ticket/create',{StartDate:getV('f-start'),EndDate:getV('f-end'),Discount:parseFloat(getV('f-disc'))||0,Qty:parseInt(getV('f-qty'))||1})
            .then(function(r){if(r.ok){showPopup({type:'success',title:'Thành công',message:'Tạo mã ưu đãi thành công.'});closeModal();renderTickets();}else{showPopup({type:'error',title:'Tạo thất bại',message:'Không thể tạo mã ưu đãi.'});}});
        } else {
            showToast('Chưa hỗ trợ thêm mới '+type,'warning');closeModal();
        }
    });
}

window.crudEdit=function(type,id){
    if(type==='supplier'){openSupplierModal(id);return;}
    openModal('Chỉnh sửa '+type, FORMS[type]||'', function(){
        if(type==='store'){
            apiPut('/store/update/'+id,{StoreName:getV('f-name'),Phone:getV('f-phone'),Email:getV('f-email'),SeatingCapacity:parseInt(getV('f-capacity'))||0})
            .then(function(r){if(r.ok){showPopup({type:'success',title:'Cập nhật thành công',message:'Đã cập nhật thành công.'});closeModal();renderStores();}else{showPopup({type:'error',title:'Cập nhật thất bại',message:'Không thể cập nhật. Vui lòng thử lại.'});}});
        } else if(type==='product'){
            apiPut('/product/update-product/'+id,{ProductName:getV('f-name'),Image:null})
            .then(function(r){if(r.ok){showPopup({type:'success',title:'Cập nhật thành công',message:'Đã cập nhật thành công.'});closeModal();renderProds();}else{showPopup({type:'error',title:'Cập nhật thất bại',message:'Không thể cập nhật. Vui lòng thử lại.'});}});
        } else if(type==='emp'){
            apiPut('/employee/Update/'+id,{FullName:getV('f-name')||undefined,Phone:getV('f-phone')||undefined,Email:getV('f-email')||undefined})
            .then(function(r){if(r.ok){showPopup({type:'success',title:'Cập nhật thành công',message:'Đã cập nhật thành công.'});closeModal();renderEmps();}else{showPopup({type:'error',title:'Cập nhật thất bại',message:'Không thể cập nhật. Vui lòng thử lại.'});}});
        } else if(type==='warehouse'){
            apiPut('/warehouse/update/'+id,{Capacity:parseInt(getV('f-wh-cap'))||0})
            .then(function(r){if(r.ok){showPopup({type:'success',title:'Cập nhật thành công',message:'Cập nhật kho thành công.'});closeModal();renderInv();}else{showPopup({type:'error',title:'Cập nhật thất bại',message:'Không thể cập nhật. Vui lòng thử lại.'});}});
        } else {
            showToast('Đã lưu (chưa kết nối API cho '+type+')','warning');closeModal();
        }
    });
};

window.crudDelete=function(type,id){
    showConfirm({type:'error',danger:true,title:'Xác nhận xoá',message:'Bạn có chắc muốn xoá mục này?',confirmText:'Xoá'}).then(function(ok){
        if(!ok)return;
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

        if(!path){showPopup({type:'warning',message:'Chưa hỗ trợ xóa '+type});return;}
        apiDelete(path).then(function(r){
            if(r.ok){showPopup({type:'success',message:'Đã xóa thành công'});showSection(document.querySelector('.adm-section.active').id.replace('section-',''));}
            else{showPopup({type:'error',message:'Xóa thất bại'});}
        }).catch(function(){showPopup({type:'error',message:'Lỗi kết nối'});});
    });
};

// Wire up Add buttons
var addBtns={'btn-add-store':'store','btn-add-product':'product','btn-add-recipe':'recipe','btn-add-supplier':'supplier','btn-add-emp':'emp','btn-add-ticket':'ticket','btn-add-warehouse':'warehouse'};
Object.keys(addBtns).forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.addEventListener('click',function(){crudAdd(addBtns[id]);});
});

// Ô tìm kiếm sản phẩm: lọc bảng theo tên (kết hợp với bộ lọc danh mục).
var _prodSearch=document.getElementById('product-search');
if(_prodSearch)_prodSearch.addEventListener('input',function(){if(typeof renderProdTable==='function')renderProdTable();});

// Combobox lọc theo danh mục (cạnh nút Thêm Sản Phẩm).
var _catFilter=document.getElementById('cat-filter');
if(_catFilter)_catFilter.addEventListener('change',function(){prodCatFilter=this.value;if(typeof renderProdTable==='function')renderProdTable();});

// Buttons riêng cho shift & receipt — không đi qua FORMS template.
var _btnShift=document.getElementById('btn-add-shift');
if(_btnShift)_btnShift.addEventListener('click',openShiftAssignModal);
var _btnRcp=document.getElementById('btn-add-receipt');
if(_btnRcp)_btnRcp.addEventListener('click',openCreatePOModal);
var _btnRcpFilter=document.getElementById('btn-filter-receipt');
if(_btnRcpFilter)_btnRcpFilter.addEventListener('click',renderReceipts);

// ===== PHIẾU NHẬP =====
function todayMinusDays(n){var d=new Date(vnTodayISO()+'T00:00:00+07:00');d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10);}

// Badge trạng thái cho danh sách phiếu nhập (gộp PO đã duyệt + phiếu nhập).
function receiptStatusInfo(st){
    if(st==='received')  return {cls:'badge-paid',tx:'Đã nhận'};
    if(st==='cancelled') return {cls:'badge-rejected',tx:'Đã huỷ'};
    return {cls:'badge-pending',tx:'Đang giao'}; // ordered (PO chưa có phiếu) | shipping (phiếu chưa xác nhận)
}
// Parse message lỗi từ body trả về (JSON {message} hoặc text thuần).
function rcpErrMsg(t){try{var p=JSON.parse(t);return p.message||p.Message||t;}catch(e){return t;}}

function renderReceipts(){
    var t=document.getElementById('receipt-tbody');if(!t)return;
    if(!ADMIN_STORE_ID){t.innerHTML='<tr><td colspan="8" class="tbl-empty">Tài khoản admin chưa được gán storeID.</td></tr>';return;}
    var sEl=document.getElementById('receipt-filter-start'),eEl=document.getElementById('receipt-filter-end');
    if(sEl && !sEl.value) sEl.value=todayMinusDays(90);
    if(eEl && !eEl.value) eEl.value=today();
    // Luôn đảm bảo ngày kết thúc >= hôm nay để hiển thị phiếu nhập mới tạo
    if(eEl && eEl.value < today()) eEl.value = today();
    var start=sEl?sEl.value:todayMinusDays(90), end=eEl?eEl.value:today();
    t.innerHTML='<tr><td colspan="8" class="tbl-empty">Đang tải...</td></tr>';
    // Gộp 2 nguồn: phiếu nhập thật (Receipt) + PO đã duyệt chưa có phiếu (đang giao) / đã huỷ.
    Promise.all([
        apiGet('/receipt/by-store/'+ADMIN_STORE_ID+'/'+start+'/'+end).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];}),
        apiGet('/purchaseorder/get-by-store/'+ADMIN_STORE_ID).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];})
    ]).then(function(res){
        var receipts=res[0]||[], pos=res[1]||[];
        RECEIPTS_DATA=receipts;
        // PO đã duyệt (Ordered) chưa có phiếu nhập -> "Đang giao" (có thể nhận/huỷ);
        // PO đã huỷ (Cancelled) trong khoảng lọc -> "Đã huỷ". Bỏ qua Submitted/Rejected.
        var poRows=pos.map(function(p){
            var appr=latestApproval(p)||{};
            var total=Number(p.total)||poDetails(p).reduce(function(s,d){return s+(Number(d.quantity)||0)*(Number(d.unitPriceExpected)||0);},0);
            return {kind:'po',id:poId(p),date:appr.lastUpdated||'',supplier:(p.supplier?p.supplier.supplierName:('#'+p.supplierID)),
                    emp:'—',lines:poDetails(p).length,total:total,status:poStatusOf(p).toLowerCase()};
        }).filter(function(x){
            if(x.status==='ordered')return true;
            if(x.status==='cancelled'){var d=(x.date||'').toString().slice(0,10);return d>=start&&d<=end;}
            return false;
        });
        var rcpRows=receipts.map(function(r){
            return {kind:'receipt',id:r.receiptID,date:r.dateReceive,supplier:(r.supplierName||'#'+r.supplierID),
                    emp:r.employeeName||'',lines:r.lineCount,total:Number(r.totalAmount)||0,
                    status:r.confirmedAt?'received':'shipping'};
        });
        var all=poRows.concat(rcpRows).sort(function(a,b){return new Date(b.date||0)-new Date(a.date||0);});
        if(!all.length){t.innerHTML='<tr><td colspan="8" class="tbl-empty">Chưa có phiếu nhập nào trong khoảng thời gian này</td></tr>';return;}
        t.innerHTML=all.map(function(x){
            var si=receiptStatusInfo(x.status);
            var act='<span style="color:#aaa;font-size:12px">—</span>';
            if(x.kind==='po'&&x.status==='ordered'){
                act='<button class="btn-approve" style="padding:4px 10px;font-size:12px;white-space:nowrap" onclick="adminReceivePO(\''+x.id+'\')"><i class="ti-check"></i> Nhận</button> '+
                    '<button class="btn-reject" style="padding:4px 10px;font-size:12px;white-space:nowrap" onclick="adminCancelPO(\''+x.id+'\')"><i class="ti-close"></i> Huỷ</button>';
            }
            return '<tr>'+
                '<td style="font-weight:700;color:var(--primary);font-family:monospace">'+(x.id||'').toString().slice(0,8).toUpperCase()+'</td>'+
                '<td style="font-size:12px">'+fmtVnDateTime(x.date)+'</td>'+
                '<td style="font-weight:600">'+x.supplier+'</td>'+
                '<td>'+x.emp+'</td>'+
                '<td style="font-weight:700">'+x.lines+'</td>'+
                '<td style="font-weight:700;color:var(--primary)">'+fv(x.total)+' đ</td>'+
                '<td>'+bdg(si.cls,si.tx)+'</td>'+
                '<td>'+act+'</td>'+
            '</tr>';
        }).join('');
    }).catch(function(){t.innerHTML='<tr><td colspan="8" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';});
}
window.openReceiptDetail=function(id){
    openModal('Chi Tiết Phiếu Nhập Kho','<div style="text-align:center;padding:20px;color:var(--muted)">Đang tải...</div>',null);
    document.getElementById('modal-confirm').style.display='none';
    apiGet('/receipt/getid/'+id)
        .then(function(r){return r.ok?r.json():null;})
        .then(function(receipt){
            if(!receipt){document.getElementById('modal-body').innerHTML='<div style="color:var(--red)">Không tìm thấy phiếu nhập.</div>';return;}
            var supplierName=(receipt.supplier&&(receipt.supplier.supplierName||receipt.supplier.SupplierName))||'—';
            var employeeName=(receipt.employee&&(receipt.employee.fullName||receipt.employee.FullName))||'—';
            var storeName=(receipt.store&&(receipt.store.storeName||receipt.store.StoreName))||'—';
            var poText=(receipt.poid||receipt.poID)?('PO #'+(receipt.poid||receipt.poID).slice(0,8).toUpperCase()):'Trực tiếp (Không PO)';
            var isConfirmed=!!(receipt.confirmedAt||receipt.ConfirmedAt);
            var details=receipt.receiptDetail||[];
            var total=details.reduce(function(acc,d){return acc+(d.goodQuantity*d.unitPrice);},0);
            var rows=details.map(function(d){
                var ing=d.ingredient||d.Ingredient||{};
                var name=ing.ingredientName||ing.IngredientName||('Mã '+d.ingredientID);
                var unit=ing.ingredientUnit||ing.IngredientUnit||'';
                return '<tr><td>'+name+'</td><td style="text-align:center">'+d.quantity+' '+unit+'</td>'+
                       '<td style="text-align:center;color:var(--green);font-weight:700">'+d.goodQuantity+'</td>'+
                       '<td style="text-align:right">'+fv(d.unitPrice)+' đ</td>'+
                       '<td style="text-align:right;font-weight:700;color:var(--primary)">'+fv(d.goodQuantity*d.unitPrice)+' đ</td></tr>';
            }).join('');
            var printBar=isConfirmed
                ?'<div style="margin-top:16px;padding-top:14px;border-top:1px solid #ECE6DF;display:flex;justify-content:flex-end">'
                 +'<button onclick="printReceiptA4(\''+id+'\')" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:#047857;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;transition:.15s" onmouseover="this.style.background=\'#065f46\'" onmouseout="this.style.background=\'#047857\'">'
                 +'<i class="ti-printer"></i> In phiếu nhập kho (A4)'
                 +'</button></div>'
                :'';
            document.getElementById('modal-body').innerHTML=
                '<div class="mov-detail-grid" style="margin-bottom:14px">'+
                '<div class="mov-detail-label">Mã phiếu:</div><div class="mov-detail-value" style="font-family:monospace;font-weight:700">'+id.slice(0,8).toUpperCase()+'</div>'+
                '<div class="mov-detail-label">Chi nhánh:</div><div class="mov-detail-value">'+storeName+'</div>'+
                '<div class="mov-detail-label">Nhà cung cấp:</div><div class="mov-detail-value" style="font-weight:600">'+supplierName+'</div>'+
                '<div class="mov-detail-label">Nhân viên nhập:</div><div class="mov-detail-value">'+employeeName+'</div>'+
                '<div class="mov-detail-label">Đơn PO:</div><div class="mov-detail-value">'+poText+'</div>'+
                '<div class="mov-detail-label">Tổng giá trị:</div><div class="mov-detail-value" style="color:var(--primary);font-weight:700">'+fv(total)+' đ</div>'+
                '</div>'+
                '<table class="mov-detail-table"><thead><tr>'+
                '<th>Nguyên liệu</th><th style="text-align:center">Nhập</th><th style="text-align:center">Đạt</th>'+
                '<th style="text-align:right">Đơn giá</th><th style="text-align:right">Thành tiền</th>'+
                '</tr></thead><tbody>'+(rows||'<tr><td colspan="5" class="tbl-empty">Không có dữ liệu</td></tr>')+'</tbody></table>'+
                printBar;
        })
        .catch(function(){document.getElementById('modal-body').innerHTML='<div style="color:var(--red)">Lỗi tải chi tiết phiếu nhập.</div>';});
};

window.printReceiptA4=function(id){
    apiGet('/receipt/getid/'+id)
        .then(function(r){return r.ok?r.json():null;})
        .then(function(receipt){
            if(!receipt){showToast('Không tìm thấy phiếu nhập','error');return;}
            var supplierName=(receipt.supplier&&(receipt.supplier.supplierName||receipt.supplier.SupplierName))||'—';
            var employeeName=(receipt.employee&&(receipt.employee.fullName||receipt.employee.FullName))||'—';
            var storeName=(receipt.store&&(receipt.store.storeName||receipt.store.StoreName))||'Chônlibi';
            var dateRaw=(receipt.dateReceive||receipt.DateReceive||'').toString().slice(0,10);
            var day=dateRaw.slice(8,10)||'.....';
            var mon=dateRaw.slice(5,7)||'.....';
            var yr=dateRaw.slice(0,4)||'20.....';
            var rid=(receipt.receiptID||id).toString();
            var details=receipt.receiptDetail||[];
            var tong=details.reduce(function(s,d){return s+(d.goodQuantity||0)*(d.unitPrice||0);},0);
            var rowsHtml=details.map(function(d,i){
                var ing=d.ingredient||d.Ingredient||{};
                var name=ing.ingredientName||ing.IngredientName||('Mã '+d.ingredientID);
                var unit=ing.ingredientUnit||ing.IngredientUnit||'';
                var maSo=(d.ingredientID||'').toString().slice(0,6).toUpperCase()||('NL'+String(i+1).padStart(2,'0'));
                var qtyExp=d.quantity||0;
                var qtyGood=d.goodQuantity||0;
                var unitPrice=d.unitPrice||0;
                var sub=qtyGood*unitPrice;
                return '<tr><td class="c">'+(i+1)+'</td><td>'+name+'</td>'
                    +'<td class="c">'+maSo+'</td>'
                    +'<td class="c">'+unit+'</td>'
                    +'<td class="r">'+Number(qtyExp).toLocaleString('vi-VN')+'</td>'
                    +'<td class="r">'+Number(qtyGood).toLocaleString('vi-VN')+'</td>'
                    +'<td class="r">'+Number(unitPrice).toLocaleString('vi-VN')+'</td>'
                    +'<td class="r">'+sub.toLocaleString('vi-VN')+'</td></tr>';
            }).join('');
            for(var k=0;k<3;k++)rowsHtml+='<tr class="empty"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
            var html='<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">'
                +'<title>Phiếu Nhập Kho - '+rid.slice(0,8).toUpperCase()+'</title>'
                +'<style>'
                +':root{--ink:#111;--line:#000;}*{box-sizing:border-box;}'
                +'body{margin:0;background:#e9eaec;font-family:"Times New Roman",Times,serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
                +'.toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:center;gap:12px;padding:12px;background:#1f2937;}'
                +'.toolbar button{font-family:system-ui,sans-serif;font-size:14px;font-weight:600;padding:8px 18px;border:0;border-radius:8px;cursor:pointer;background:#E8590C;color:#fff;}'
                +'.toolbar .hint{color:#cbd5e1;font-family:system-ui,sans-serif;font-size:12px;align-self:center;}'
                +'.sheet{width:210mm;min-height:297mm;margin:16px auto;padding:14mm 16mm;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.18);font-size:13.5pt;line-height:1.45;}'
                +'.head{display:flex;justify-content:space-between;align-items:flex-start;}'
                +'.head .left{width:48%;}.head .right{width:48%;text-align:right;}'
                +'.mau{font-weight:700;}.tt{font-style:italic;font-size:11.5pt;line-height:1.3;}'
                +'.title{text-align:center;margin:14px 0 2px;}'
                +'.title h1{font-size:18pt;font-weight:700;letter-spacing:1px;margin:0;text-transform:uppercase;}'
                +'.title .date{font-style:italic;font-size:12.5pt;}'
                +'.nocc{display:flex;justify-content:center;gap:34px;font-size:12.5pt;margin-bottom:8px;}'
                +'.meta p{margin:4px 0;}.fill{border-bottom:1px dotted #555;}'
                +'table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12.5pt;}'
                +'th,td{border:1px solid var(--line);padding:4px 6px;vertical-align:middle;}'
                +'th{text-align:center;font-weight:700;}'
                +'.c{text-align:center;}.r{text-align:right;}'
                +'.codes td{text-align:center;font-style:italic;font-size:11pt;padding:2px;}'
                +'.empty td{height:26px;}.sum td{font-weight:700;}'
                +'.total-words{margin:6px 0;}'
                +'.sign-wrap{margin-top:14px;page-break-inside:avoid;}'
                +'.sign-date{text-align:right;font-style:italic;font-size:12.5pt;margin-right:6%;margin-bottom:6px;}'
                +'.signs{display:flex;justify-content:space-between;text-align:center;}'
                +'.signs .col{width:24%;}.signs .role{font-weight:700;font-size:12.5pt;}'
                +'.signs .sub{font-style:italic;font-size:11pt;}.signs .space{height:70px;}.signs .name{font-weight:600;}'
                +'.note{font-style:italic;font-size:10.5pt;color:#333;margin-top:16px;border-top:1px solid #999;padding-top:6px;}'
                +'@media print{@page{size:A4;margin:12mm;}body{background:#fff;}.toolbar{display:none;}'
                +'.sheet{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none;}.note{color:#000;}}'
                +'</style></head><body>'
                +'<div class="toolbar"><button onclick="window.print()">🖨️ In phiếu (A4)</button>'
                +'<span class="hint">Mẹo: trong hộp thoại in, chọn "Lưu thành PDF" để xuất file.</span></div>'
                +'<div class="sheet">'
                +'<div class="head"><div class="left">'
                +'<p style="margin:2px 0">Đơn vị: <b>'+storeName+'</b></p>'
                +'<p style="margin:2px 0">Bộ phận: <span class="fill">Kho nguyên liệu</span></p>'
                +'</div><div class="right">'
                +'<p class="mau" style="margin:2px 0">Mẫu số: 01 - VT</p>'
                +'<p class="tt" style="margin:2px 0">(Kèm theo Thông tư số 99/2025/TT-BTC<br>ngày 27 tháng 10 năm 2025 của<br>Bộ trưởng Bộ Tài chính)</p>'
                +'</div></div>'
                +'<div class="title"><h1>Phiếu Nhập Kho</h1>'
                +'<div class="date">Ngày '+day+' tháng '+mon+' năm '+yr+'</div></div>'
                +'<div class="nocc"><span>Số: <b>'+rid.slice(0,8).toUpperCase()+'</b></span>'
                +'<span>Nợ: <span class="fill">.............</span></span>'
                +'<span>Có: <span class="fill">.............</span></span></div>'
                +'<div class="meta">'
                +'<p>- Họ và tên người giao: <b>'+supplierName+'</b></p>'
                +'<p>- Theo đơn đặt hàng số <b>'+rid.slice(0,8).toUpperCase()+'</b> ngày '+day+' tháng '+mon+' năm '+yr+' của <span class="fill">'+supplierName+'</span></p>'
                +'<p>- Nhập tại kho: <b>Kho nguyên liệu</b> &nbsp;&nbsp; Địa điểm: <span class="fill">'+storeName+'</span></p>'
                +'</div>'
                +'<table><thead>'
                +'<tr><th rowspan="2" style="width:5%">STT</th>'
                +'<th rowspan="2">Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hóa</th>'
                +'<th rowspan="2" style="width:8%">Mã số</th>'
                +'<th rowspan="2" style="width:9%">Đơn vị tính</th>'
                +'<th colspan="2" style="width:18%">Số lượng</th>'
                +'<th rowspan="2" style="width:13%">Đơn giá</th>'
                +'<th rowspan="2" style="width:16%">Thành tiền</th></tr>'
                +'<tr><th style="width:9%">Theo chứng từ</th><th style="width:9%">Thực nhập</th></tr>'
                +'<tr class="codes"><td>A</td><td>B</td><td>C</td><td>D</td><td>1</td><td>2</td><td>3</td><td>4</td></tr>'
                +'</thead><tbody>'+rowsHtml+'</tbody>'
                +'<tfoot><tr class="sum"><td class="c"></td><td><b>Cộng</b></td>'
                +'<td class="c">x</td><td class="c">x</td><td class="c">x</td><td class="c">x</td><td class="c">x</td>'
                +'<td class="r">'+tong.toLocaleString('vi-VN')+'</td></tr></tfoot>'
                +'</table>'
                +'<div class="total-words">- Tổng số tiền (viết bằng chữ): <i>'+docTienVND(tong)+'</i></div>'
                +'<div style="margin:4px 0 0">- Số chứng từ gốc kèm theo: <span class="fill">................................</span></div>'
                +'<div class="sign-wrap">'
                +'<div class="sign-date">TP. HCM, ngày '+day+' tháng '+mon+' năm '+yr+'</div>'
                +'<div class="signs">'
                +'<div class="col"><div class="role">Người lập phiếu</div><div class="sub">(Ký, họ tên)</div>'
                +'<div class="space"></div>'+(employeeName?'<div class="name">'+employeeName+'</div>':'')+'</div>'
                +'<div class="col"><div class="role">Người giao hàng</div><div class="sub">(Ký, họ tên)</div><div class="space"></div></div>'
                +'<div class="col"><div class="role">Thủ kho</div><div class="sub">(Ký, họ tên)</div><div class="space"></div></div>'
                +'<div class="col"><div class="role">Kế toán trưởng</div><div class="sub">(Hoặc bộ phận có nhu cầu nhập)<br>(Ký, họ tên)</div><div class="space"></div></div>'
                +'</div></div>'
                +'<div class="note">Ghi chú: Tùy theo đặc điểm hoạt động sản xuất kinh doanh và yêu cầu quản lý của đơn vị mình, doanh nghiệp được xây dựng, thiết kế biểu mẫu chứng từ kế toán.</div>'
                +'</div></body></html>';
            var win=window.open('','_blank','width=920,height=750');
            if(win){win.document.write(html);win.document.close();}
        })
        .catch(function(){showToast('Không thể tải dữ liệu để in!','error');});
};

// Admin nhận hàng cho 1 PO đã duyệt: tạo phiếu nhập (Receipt) rồi xác nhận để
// cộng kho — y hệt luồng nhân viên, gói gọn trong 1 modal. Sau khi xác nhận
// PO chuyển sang trạng thái Received (BE tự ghi POApproval).
window.adminReceivePO=function(poId){
    Promise.all([
        apiGet('/receipt/prefill-from-po/'+poId).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),
        apiGet('/warehouse/get-by-store/'+ADMIN_STORE_ID).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];})
    ]).then(function(res){
        var data=res[0], whs=res[1]||[];
        if(!data){showToast('Không tải được thông tin đơn mua','error');return;}
        var lines=data.poDetailLines||data.PODetailLines||[];
        if(!lines.length){showToast('Đơn mua không có nguyên liệu','error');return;}
        var whOpts=whs.map(function(w){var id=(w.warehouseID||w.WarehouseID);return '<option value="'+id+'">'+(w.name||w.Name||('Kho '+id))+'</option>';}).join('')||'<option value="">-- Không có kho --</option>';
        var todayStr=today();
        var expStr=(function(){var d=new Date(todayStr+'T00:00:00+07:00');d.setUTCDate(d.getUTCDate()+30);return d.toISOString().slice(0,10);})();
        var rows=lines.map(function(it){
            var iid=it.ingredientID||it.IngredientID;
            var name=it.ingredientName||it.IngredientName||('NL '+iid);
            var qy=Number(it.quantityExpected||it.QuantityExpected)||0;
            var up=Number(it.unitPriceExpected||it.UnitPriceExpected)||0;
            return '<tr data-iid="'+iid+'" data-up="'+up+'">'+
                '<td style="font-weight:600">'+name+'</td>'+
                '<td style="text-align:center">'+fv(qy)+'</td>'+
                '<td><input type="number" class="form-control arl-qty" value="'+qy+'" step="0.1" min="0" style="width:80px;padding:4px"></td>'+
                '<td><input type="number" class="form-control arl-gq" value="'+qy+'" step="0.1" min="0" style="width:80px;padding:4px"></td>'+
                '<td style="text-align:right">'+fv(up)+' đ</td>'+
                '<td><input type="date" class="form-control arl-mfd" value="'+todayStr+'" style="width:135px;padding:4px"></td>'+
                '<td><input type="date" class="form-control arl-exp" value="'+expStr+'" style="width:135px;padding:4px"></td>'+
            '</tr>';
        }).join('');
        var body=
            '<div class="form-group"><label class="form-label">Kho nhập</label><select id="arl-wh" class="form-control">'+whOpts+'</select></div>'+
            '<div class="tbl-wrap" style="overflow:auto"><table style="font-size:13px"><thead><tr>'+
            '<th>Nguyên liệu</th><th style="text-align:center">SL yêu cầu</th><th>SL thực nhận</th><th>SL tốt</th><th style="text-align:right">Đơn giá</th><th>NSX</th><th>HSD</th>'+
            '</tr></thead><tbody>'+rows+'</tbody></table></div>';
        openModal('Nhận Hàng (PO #'+poId.toString().slice(0,8).toUpperCase()+')',body,function(){submitAdminReceive(poId);});
        document.getElementById('modal-box').style.maxWidth='960px';
    }).catch(function(){showToast('Lỗi tải dữ liệu nhận hàng','error');});
};
function submitAdminReceive(poId){
    var whEl=document.getElementById('arl-wh');
    var whId=parseInt(whEl?whEl.value:'')||0;
    if(!whId){showToast('Vui lòng chọn kho nhập','warning');return;}
    var rows=document.querySelectorAll('#modal-body tbody tr');
    var receiptLines=[], confirmLines=[], bad='';
    rows.forEach(function(row){
        var iid=parseInt(row.getAttribute('data-iid'))||0;
        var up=Number(row.getAttribute('data-up'))||0;
        var qty=parseFloat(row.querySelector('.arl-qty').value)||0;
        var gq=parseFloat(row.querySelector('.arl-gq').value)||0;
        var mfd=row.querySelector('.arl-mfd').value;
        var exp=row.querySelector('.arl-exp').value;
        if(qty<=0){bad='qty';return;}
        if(gq<0||gq>qty){bad='gq';return;}
        if(up<=0){bad='price';return;}
        if(!mfd||!exp){bad='date';return;}
        receiptLines.push({IngredientID:iid,Quantity:qty,GoodQuantity:gq,UnitPrice:up});
        confirmLines.push({IngredientID:iid,WarehouseID:whId,Mfd:mfd,Exp:exp,BatchCode:null});
    });
    if(bad==='qty'){showToast('SL thực nhận phải lớn hơn 0','warning');return;}
    if(bad==='gq'){showToast('SL tốt phải nằm trong khoảng [0, SL thực nhận]','warning');return;}
    if(bad==='price'){showToast('Nguyên liệu chưa có đơn giá','warning');return;}
    if(bad==='date'){showToast('Vui lòng nhập NSX và HSD cho mọi nguyên liệu','warning');return;}
    if(!receiptLines.length){showToast('Không có nguyên liệu hợp lệ','warning');return;}
    var empId=localStorage.getItem('employeeId')||'';
    var ok=document.getElementById('modal-confirm');if(ok)ok.disabled=true;
    apiPost('/receipt/create',{POID:poId,EmployeeID:empId,ReceiptLines:receiptLines})
        .then(function(r){return r.ok?r.json():r.text().then(function(t){throw new Error(rcpErrMsg(t));});})
        .then(function(d){
            var rid=d.receiptID||d.ReceiptID;
            return apiPost('/receipt/confirm',{ReceiptID:rid,EmployeeID:empId,Lines:confirmLines})
                .then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(rcpErrMsg(t));});});
        })
        .then(function(){showPopup({type:'success',title:'Nhập kho thành công',message:'Nhận hàng & nhập kho thành công.'});closeModal();renderReceipts();})
        .catch(function(err){if(ok)ok.disabled=false;showPopup({type:'error',title:'Nhận hàng thất bại',message:err.message||'Không thể nhận hàng.'});});
}
// Admin huỷ 1 PO đã duyệt (Ordered -> Cancelled), bắt buộc nhập lý do.
window.adminCancelPO=function(poId){
    var body='<div class="form-group"><label class="form-label">Lý do huỷ đơn</label>'+
             '<textarea id="po-cancel-reason" class="form-control" rows="3" placeholder="Nhập lý do huỷ đơn..."></textarea></div>';
    openModal('Huỷ Đơn (PO #'+poId.toString().slice(0,8).toUpperCase()+')',body,function(){
        var reason=(document.getElementById('po-cancel-reason').value||'').trim();
        if(!reason){showToast('Vui lòng nhập lý do huỷ','warning');return;}
        var empId=localStorage.getItem('employeeId')||'00000000-0000-0000-0000-000000000000';
        apiPut('/purchaseorder/update/'+poId,{EmployeeID:empId,POStatus:'Cancelled',Comment:'',CancelledReason:reason})
            .then(function(r){
                if(r.ok){showPopup({type:'success',title:'Đã huỷ đơn',message:'Đã huỷ đơn thành công.'});closeModal();renderReceipts();}
                else{r.json().then(function(d){showPopup({type:'error',title:'Huỷ đơn thất bại',message:d.message||'Không thể huỷ đơn.'});}).catch(function(){showPopup({type:'error',title:'Huỷ đơn thất bại',message:'Không thể huỷ đơn.'});});}
            }).catch(function(){showToast('Lỗi kết nối','error');});
    });
};

// Modal thêm/sửa NCC kèm gán nguyên liệu NCC cung cấp — nuôi bảng SupplierIngredient
// để lọc NCC theo nguyên liệu khi lập đơn mua hàng.
function openSupplierModal(id){
    var isEdit=!!id;
    Promise.all([
        apiGet('/ingredient/get-all').then(function(r){return r.ok?r.json():[];}),
        isEdit?apiGet('/supplier/get/'+id).then(function(r){return r.ok?r.json():null;}):Promise.resolve(null)
    ]).then(function(res){
        var ings=res[0]||[], sup=res[1];
        var selected={};
        if(sup&&sup.ingredientIDs)sup.ingredientIDs.forEach(function(i){selected[i]=true;});
        var checks=ings.map(function(i){
            return '<label style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:13px;cursor:pointer">'+
                '<input type="checkbox" class="f-supp-ing" value="'+i.ingredientID+'"'+(selected[i.ingredientID]?' checked':'')+'>'+
                i.ingredientName+' ('+i.ingredientUnit+')</label>';
        }).join('')||'<div style="color:#888;font-size:13px">Chưa có nguyên liệu nào</div>';
        var body=
            '<div class="form-group"><label class="form-label">Tên NCC</label><input id="f-name" class="form-control" placeholder="Tên nhà cung cấp"></div>'+
            '<div class="form-group"><label class="form-label">Số điện thoại</label><input id="f-phone" class="form-control" placeholder="090x xxx xxx"></div>'+
            '<div class="form-group"><label class="form-label">Email</label><input id="f-email" type="email" class="form-control" placeholder="email@ncc.vn"></div>'+
            '<div class="form-group"><label class="form-label">Mã số thuế</label><input id="f-tax" class="form-control" placeholder="0100000000"></div>'+
            '<div class="form-group"><label class="form-label">Nguyên liệu cung cấp</label>'+
                '<div style="max-height:200px;overflow:auto;border:1px solid #eee;border-radius:8px;padding:8px">'+checks+'</div>'+
            '</div>';
        openModal((isEdit?'Chỉnh sửa':'Thêm mới')+' nhà cung cấp', body, function(){
            var ingIDs=[];
            document.querySelectorAll('.f-supp-ing:checked').forEach(function(c){ingIDs.push(parseInt(c.value));});
            if(!getV('f-name')){showToast('Vui lòng nhập tên NCC','warning');return;}
            var payload={SupplierName:getV('f-name'),Phone:getV('f-phone'),Email:getV('f-email'),TaxCode:getV('f-tax'),IngredientIDs:ingIDs};
            var req=isEdit?apiPut('/supplier/update/'+id,payload):apiPost('/supplier/create',payload);
            req.then(function(r){
                if(r.ok){showPopup({type:'success',title:'Thành công',message:isEdit?'Cập nhật nhà cung cấp thành công.':'Thêm nhà cung cấp thành công.'});closeModal();renderSupps();}
                else{showPopup({type:'error',title:isEdit?'Cập nhật thất bại':'Thêm thất bại',message:'Không thể lưu nhà cung cấp.'});}
            }).catch(function(){showToast('Lỗi kết nối','error');});
        });
        // Prefill ô text qua JS để tránh lỗi escape ký tự trong value=""
        if(sup){
            var f;
            if((f=document.getElementById('f-name')))f.value=sup.supplierName||'';
            if((f=document.getElementById('f-phone')))f.value=sup.phone||'';
            if((f=document.getElementById('f-email')))f.value=sup.email||'';
            if((f=document.getElementById('f-tax')))f.value=sup.taxCode||'';
        }
    }).catch(function(){showToast('Lỗi tải dữ liệu nguyên liệu','error');});
}

// "Lập Phiếu Nhập" = tạo Đơn Mua Hàng (PO) trạng thái chờ duyệt.
// Quy trình: tạo PO ở đây -> Manager duyệt ở mục Đơn Mua Hàng -> khi hàng về,
// Admin/manager lập Đơn Mua Hàng (PO) mới chờ duyệt.
// Phiếu nhập kho thực sự do nhân viên tạo sau khi hàng về (tab Nhập Kho ở employee portal).
function openCreatePOModal(){
    if(!ADMIN_STORE_ID){showToast('Tài khoản admin chưa được gán storeID','error');return;}
    Promise.all([
        apiGet('/supplier/get-all').then(function(r){return r.ok?r.json():[];}),
        apiGet('/ingredient/get-all').then(function(r){return r.ok?r.json():[];})
    ]).then(function(res){
        var supps=res[0]||[], ings=res[1]||[]; INGREDIENTS_DATA=ings;
        var ingById={}; ings.forEach(function(i){ingById[i.ingredientID]=i;});
        var selectableSupps=supps;
        var suppOpts='<option value="">-- Chọn NCC --</option>'+selectableSupps.map(function(s){return '<option value="'+s.supplierID+'">'+s.supplierName+'</option>';}).join('');
        var body=
            '<div class="form-group"><label class="form-label">Nhà cung cấp</label>'+
                '<select id="f-rcp-supp" class="form-control">'+suppOpts+'</select>'+
                '<div id="rcp-supp-hint" style="font-size:12px;color:#888;margin-top:4px">'+(selectableSupps.length?'':'Chưa có nhà cung cấp nào.')+'</div>'+
            '</div>'+
            '<div class="form-group"><label class="form-label">Danh sách nguyên liệu</label>'+
                '<div id="rcp-lines"></div>'+
                '<button type="button" class="btn-secondary" id="btn-add-rcp-line" style="margin-top:8px;padding:6px 14px;font-size:13px">+ Thêm dòng</button>'+
                '<div id="rcp-total" style="text-align:right;font-weight:700;margin-top:8px;color:var(--primary)"></div>'+
            '</div>';
        openModal('Lập Phiếu Nhập (Store #'+ADMIN_STORE_ID+')', body, function(){
            var suppID=parseInt(document.getElementById('f-rcp-supp').value)||0;
            if(!suppID){showToast('Vui lòng chọn nhà cung cấp','warning');return;}
            var rows=document.querySelectorAll('.rcp-line-row');
            var items=[], seen={}, bad='';
            rows.forEach(function(row){
                var iid=parseInt(row.querySelector('.f-rcp-ing').value)||0;
                var qty=parseFloat(row.querySelector('.f-rcp-qty').value)||0;
                if(iid<=0)return;
                if(seen[iid]){bad='dup';return;}
                seen[iid]=true;
                var ing=ingById[iid];
                var price=ing?(Number(ing.costPerUnit)||0):0;
                if(qty<=0){bad='qty';return;}
                if(price<=0){bad='price';return;}
                items.push({IngredientID:iid,Quantity:qty,UnitPriceExpected:price});
            });
            if(bad==='dup'){showToast('Có nguyên liệu bị chọn trùng dòng','warning');return;}
            if(bad==='qty'){showToast('Số lượng phải lớn hơn 0','warning');return;}
            if(bad==='price'){showToast('Nguyên liệu chưa có đơn giá. Hãy cập nhật đơn giá nguyên liệu trước.','warning');return;}
            if(!items.length){showToast('Vui lòng thêm ít nhất 1 nguyên liệu','warning');return;}
            var empID=localStorage.getItem('employeeId')||'';
            apiPost('/purchaseorder/create',{
                StoreID:ADMIN_STORE_ID, SupplierID:suppID, EmployeeID:empID, TaxRate:0, Comment:'', Items:items
            }).then(function(r){
                if(r.status===201 || r.ok){
                    showPopup({type:'success',title:'Tạo đơn thành công',message:'Tạo đơn mua hàng (PO) thành công, đang chờ duyệt.'});
                    closeModal();
                    // Chuyển sang màn Phê Duyệt, lọc về "Chờ Duyệt" để thấy ngay PO vừa tạo.
                    poFilter='pending';
                    document.querySelectorAll('#po-filter-tabs .ftab').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-filter')==='pending');});
                    showSection('purchase-orders');
                } else {
                    r.json().then(function(d){showPopup({type:'error',title:'Tạo đơn thất bại',message:d.message||'Không thể tạo đơn mua hàng.'});}).catch(function(){showPopup({type:'error',title:'Tạo đơn thất bại',message:'Không thể tạo đơn mua hàng.'});});
                }
            }).catch(function(){showToast('Lỗi kết nối','error');});
        });

        var ll=document.getElementById('rcp-lines');
        var suppSel=document.getElementById('f-rcp-supp');
        var totalEl=document.getElementById('rcp-total');

        function currentSupplier(){
            return supps.filter(function(s){return String(s.supplierID)===String(suppSel.value);})[0];
        }
        // Options nguyên liệu lọc theo NCC đang chọn. Nếu NCC chưa gán nguyên liệu thì hiện tất cả.
        function ingOptsForSupplier(){
            var s=currentSupplier();
            if(!s)return '<option value="">-- Chọn NCC trước --</option>';
            var ids=s.ingredientIDs||[];
            var list=ids.length>0?ings.filter(function(i){return ids.indexOf(i.ingredientID)>=0;}):ings;
            if(!list.length)return '<option value="">-- Chưa có nguyên liệu --</option>';
            return '<option value="">-- Nguyên liệu --</option>'+list.map(function(i){return '<option value="'+i.ingredientID+'">'+i.ingredientName+' ('+i.ingredientUnit+')</option>';}).join('');
        }
        function updateUnit(row){
            var ing=ingById[parseInt(row.querySelector('.f-rcp-ing').value)||0];
            row.querySelector('.f-rcp-unitprice').textContent=ing?(fv(Number(ing.costPerUnit)||0)+' đ/'+ing.ingredientUnit):'—';
        }
        function refreshTotal(){
            var total=0;
            document.querySelectorAll('.rcp-line-row').forEach(function(row){
                var iid=parseInt(row.querySelector('.f-rcp-ing').value)||0;
                var qty=parseFloat(row.querySelector('.f-rcp-qty').value)||0;
                var ing=ingById[iid];
                var price=ing?(Number(ing.costPerUnit)||0):0;
                var lineTotal=qty*price;
                var lt=row.querySelector('.f-rcp-linetotal');
                if(lt)lt.textContent=(iid>0 && price>0)?(fv(lineTotal)+' đ'):'—';
                total+=lineTotal;
            });
            if(totalEl)totalEl.textContent='Tạm tính: '+fv(total)+' đ';
        }
        // Đổi NCC -> dựng lại options nguyên liệu cho mọi dòng, giữ lựa chọn nếu vẫn hợp lệ.
        function rebuildIngOptions(){
            var opts=ingOptsForSupplier();
            document.querySelectorAll('.rcp-line-row').forEach(function(row){
                var sel=row.querySelector('.f-rcp-ing'), prev=sel.value;
                sel.innerHTML=opts;
                sel.value=(prev && sel.querySelector('option[value="'+prev+'"]'))?prev:'';
                updateUnit(row);
            });
            refreshTotal();
        }
        suppSel.addEventListener('change',rebuildIngOptions);

        function addRow(){
            var row=document.createElement('div');
            row.className='rcp-line-row';
            row.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:6px;';
            row.innerHTML=
                '<select class="form-control f-rcp-ing" style="flex:2">'+ingOptsForSupplier()+'</select>'+
                '<input class="form-control f-rcp-qty" type="number" placeholder="Số lượng" min="0" step="0.01" style="flex:1">'+
                '<span class="f-rcp-unitprice" style="flex:1.2;font-size:12px;color:#666;text-align:right">—</span>'+
                '<span class="f-rcp-linetotal" style="flex:1.2;font-size:12px;font-weight:700;text-align:right">—</span>'+
                '<button type="button" class="btn-del" style="padding:4px 8px"><i class="ti-trash"></i></button>';
            ll.appendChild(row);
            row.querySelector('.f-rcp-ing').addEventListener('change',function(){updateUnit(row);refreshTotal();});
            row.querySelector('.f-rcp-qty').addEventListener('input',refreshTotal);
            row.querySelector('.btn-del').addEventListener('click',function(){row.remove();refreshTotal();});
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
                if(r.ok){showPopup({type:'success',title:'Phân ca thành công',message:'Đã phân ca thành công.'});closeModal();renderShifts();}
                else r.json().then(function(d){showPopup({type:'error',title:'Phân ca thất bại',message:d.message||'Không thể phân ca.'});}).catch(function(){showPopup({type:'error',title:'Phân ca thất bại',message:'Không thể phân ca.'});});
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
        // Chỉ cho tạo kho trong store của admin hiện tại.
        stores=(stores||[]).filter(function(s){return !ADMIN_STORE_ID||s.storeID===ADMIN_STORE_ID;});
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
            .then(function(r){if(r.ok){showPopup({type:'success',title:'Thành công',message:'Tạo kho thành công.'});closeModal();renderInv();}else{showPopup({type:'error',title:'Tạo kho thất bại',message:'Không thể tạo kho.'});}})
            .catch(function(){showToast('Lỗi kết nối','error');});
        });
    }).catch(function(){showToast('Không thể tải danh sách chi nhánh','error');});
}

// ===== ADD STORE MODAL =====
// Thêm chi nhánh mới kèm địa chỉ + tài khoản ngân hàng + tài khoản quản lý.
// Manager vừa tạo sẽ có StoreID = StoreID của store mới (xử lý ở backend).
function openAddStoreModal(){
    var bankOpts=['MB','VCB','TCB','ACB','BIDV','VPB','TPB','VIB','MSB','OCB','STB','HDB','SHB','EIB','VBA','SCB','SeABank']
        .map(function(c){return '<option value="'+c+'">'+c+'</option>';}).join('');
    var sec=function(t){return '<div style="font-weight:700;color:var(--primary);margin:16px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border,#eee);padding-bottom:4px">'+t+'</div>';};
    var body=
        sec('Thông tin chi nhánh')+
        '<div class="form-group"><label class="form-label">Tên chi nhánh *</label><input id="f-store-name" class="form-control" placeholder="VD: Chônlibi Q1"></div>'+
        '<div style="display:flex;gap:10px">'+
            '<div class="form-group" style="flex:1"><label class="form-label">Số điện thoại *</label><input id="f-store-phone" class="form-control" placeholder="090x xxx xxx"></div>'+
            '<div class="form-group" style="flex:1"><label class="form-label">Sức chứa</label><input id="f-store-capacity" type="number" class="form-control" placeholder="50"></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Email *</label><input id="f-store-email" type="email" class="form-control" placeholder="store@chonlibi.vn"></div>'+

        sec('Địa chỉ')+
        '<div class="form-group"><label class="form-label">Số nhà, đường *</label><input id="f-addr-street" class="form-control" placeholder="VD: 123 Lê Lợi"></div>'+
        '<div style="display:flex;gap:10px">'+
            '<div class="form-group" style="flex:1"><label class="form-label">Quận/Huyện *</label><input id="f-addr-district" class="form-control" placeholder="Quận 1"></div>'+
            '<div class="form-group" style="flex:1"><label class="form-label">Tỉnh/Thành *</label><input id="f-addr-province" class="form-control" placeholder="TP. Hồ Chí Minh"></div>'+
        '</div>'+

        sec('Tài khoản ngân hàng')+
        '<div style="display:flex;gap:10px">'+
            '<div class="form-group" style="flex:2"><label class="form-label">Số tài khoản *</label><input id="f-bank-number" class="form-control" placeholder="0123456789"></div>'+
            '<div class="form-group" style="flex:1"><label class="form-label">Ngân hàng *</label><select id="f-bank-code" class="form-control">'+bankOpts+'</select></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Chủ tài khoản *</label><input id="f-bank-holder" class="form-control" placeholder="NGUYEN VAN A"></div>'+

        sec('Tài khoản quản lý (Manager)')+
        '<div style="display:flex;gap:10px">'+
            '<div class="form-group" style="flex:1"><label class="form-label">Tên đăng nhập *</label><input id="f-mgr-username" class="form-control" placeholder="manager_q1"></div>'+
            '<div class="form-group" style="flex:1"><label class="form-label">Mật khẩu *</label><input id="f-mgr-pass" type="password" class="form-control" placeholder="Tối thiểu 6 ký tự"></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Họ tên *</label><input id="f-mgr-fullname" class="form-control" placeholder="Họ tên quản lý"></div>'+
        '<div style="display:flex;gap:10px">'+
            '<div class="form-group" style="flex:1"><label class="form-label">Số điện thoại *</label><input id="f-mgr-phone" class="form-control" placeholder="090x xxx xxx"></div>'+
            '<div class="form-group" style="flex:1"><label class="form-label">Email</label><input id="f-mgr-email" type="email" class="form-control" placeholder="manager@chonlibi.vn"></div>'+
        '</div>'+
        '<div style="display:flex;gap:10px">'+
            '<div class="form-group" style="flex:1"><label class="form-label">Ngày sinh</label><input id="f-mgr-birth" type="date" class="form-control"></div>'+
            '<div class="form-group" style="flex:1"><label class="form-label">Giới tính</label><select id="f-mgr-gender" class="form-control"><option value="Male">Nam</option><option value="Female">Nữ</option><option value="Others">Khác</option></select></div>'+
            '<div class="form-group" style="flex:1"><label class="form-label">Lương cơ bản</label><input id="f-mgr-salary" type="number" class="form-control" placeholder="8000000"></div>'+
        '</div>';

    openModal('Thêm Chi Nhánh Mới', body, function(){
        var payload={
            StoreName:getV('f-store-name'),
            Phone:getV('f-store-phone'),
            Email:getV('f-store-email'),
            SeatingCapacity:parseInt(getV('f-store-capacity'))||0,
            StreetAddress:getV('f-addr-street'),
            District:getV('f-addr-district'),
            Province:getV('f-addr-province'),
            BankAccountNumber:getV('f-bank-number'),
            BankCode:getV('f-bank-code'),
            BankAccountHolderName:getV('f-bank-holder'),
            Manager:{
                UserName:getV('f-mgr-username'),
                Password:getV('f-mgr-pass'),
                FullName:getV('f-mgr-fullname'),
                Phone:getV('f-mgr-phone'),
                Email:getV('f-mgr-email')||null,
                BirthDate:getV('f-mgr-birth')||null,
                Gender:getV('f-mgr-gender'),
                BasicSalary:parseFloat(getV('f-mgr-salary'))||0
            }
        };
        // Validate các trường bắt buộc trước khi gọi API.
        if(!payload.StoreName||!payload.Phone||!payload.Email){showToast('Vui lòng nhập đủ thông tin chi nhánh','warning');return;}
        if(!payload.StreetAddress||!payload.District||!payload.Province){showToast('Vui lòng nhập đầy đủ địa chỉ','warning');return;}
        if(!payload.BankAccountNumber||!payload.BankCode||!payload.BankAccountHolderName){showToast('Vui lòng nhập đầy đủ tài khoản ngân hàng','warning');return;}
        var mg=payload.Manager;
        if(!mg.UserName||!mg.Password||!mg.FullName||!mg.Phone){showToast('Vui lòng nhập đủ thông tin tài khoản quản lý','warning');return;}

        apiPost('/store/add-full',payload).then(function(r){
            if(r.ok){showPopup({type:'success',title:'Thành công',message:'Thêm chi nhánh và tài khoản quản lý thành công.'});closeModal();renderStores();}
            else{r.json().then(function(d){showPopup({type:'error',title:'Thêm thất bại',message:(d&&d.message)||'Không thể thêm chi nhánh.'});}).catch(function(){showPopup({type:'error',title:'Thêm thất bại',message:'Không thể thêm chi nhánh.'});});}
        }).catch(function(){showToast('Lỗi kết nối','error');});
    });
    // Form nhiều trường → mở rộng modal cho dễ nhìn.
    document.getElementById('modal-box').style.maxWidth='640px';
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
                    if(r.ok){showPopup({type:'success',title:'Thành công',message:'Lưu công thức thành công.'});closeModal();renderRecipes();}
                    else{r.text().then(function(t){showPopup({type:'error',title:'Lưu thất bại',message:t||'Không thể lưu công thức.'});});}
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
document.addEventListener('DOMContentLoaded',function(){showSection('dashboard');refreshPOBadge();});
