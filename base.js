var abilocation="./smart_contracts/";
var plz="69256";
var last_reading = {};
function resolve(address) {
	name=address;
	if(window.localStorage.getItem("address_"+address.toLowerCase())!=null) {
			name=window.localStorage.getItem("address_"+address.toLowerCase());
	}
	if(name.length<1) name=address;
	if(name.length>17) name=name.substr(0,17)+"...";
	return name;
}

$.qparams = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURI(results[1]) || 0;
    }
}

var extid="autostrom.stromdao.de";

if($.qparams("extid")!=null) {
		extid=$.qparams("extid");
}
if(window.localStorage.getItem("ext:"+extid)) {
	var node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"./smart_contracts/"});
	//open_username(node); Removed for GSI Only Client
} 
var node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:"./smart_contracts/"});

// Fill View (HTML) using JQuery
$('.account').html(node.wallet.address);


function open_username(node) {
	$('.account').html(resolve(node.wallet.address));
	node.roleLookup().then(function(rl) {
		$('#brain_frm').hide();
		$('#pk_frm').hide();
		$('#app').show();
		rl.relations(node.wallet.address,42).then(function(tx) {
				document.stromdao_sc=tx;
				app("./app_dashboard.html");
		});
		rl.relations(node.wallet.address,41).then(function(tx) {
				document.stromdao_blg=tx;				
		});
		rl.relations(node.wallet.address,45).then(function(tx) {
				document.stromdao_cutkn=tx;				
		});
	});	
}
$('#open_username,#open_gsi').click(function() {
	$('#open_username').attr('disabled','disabled');
	if($('#username').val().length==0) {
		plz=$('#plz').val();
		node.storage.setItemSync("plz",plz);		
		open_username(node);
		return;
	}
	var account_obj=new document.StromDAOBO.Account($('#username').val(),$('#password').val());
	account_obj.wallet().then(function(wallet) {
		node.roleLookup().then(function(rl) {
			rl.relations(wallet.address,222).then(function(tx) {
				if(tx=="0x0000000000000000000000000000000000000000") {
					$('#pk_secret').val(node.wallet.privateKey);
					$('#brain_frm').hide();									
					$('#pk_frm').show();
					$('#cancel_pk').click(function() {
							$('#open_username').removeAttr('disabled');
							$('#pk_frm').hide();
							$('#brain_frm').show();
					});
					$('#open_pk').click(function() {
						$('#open_pk').attr('disabled','disabled');
						$('#cancel_pk').attr('disabled','disabled');
						account_obj.encrypt($('#pk_secret').val()).then(function(enc) {
							node.stringstoragefactory().then(function(ssf) {
								ssf.build(enc).then(function(ss) {											
									window.localStorage.setItem("ext:"+extid,$('#pk_secret').val());
									node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:abilocation	});
									node.roleLookup().then(function(rl2) {
										rl2.setRelation(222,ss).then(function(tx) {
												open_username(node);									
										});
									});
								});
							});
						});
					});
				} else {
					node.stringstorage(tx).then(function(ss) {
						ss.str().then(function(str) {
							account_obj.decrypt(str).then(function(pk) {																
								window.localStorage.setItem("ext:"+extid,pk);
								node = new document.StromDAOBO.Node({external_id:extid,testMode:true,rpc:"https://fury.network/rpc",abilocation:abilocation});
								$('.account').html(resolve(node.wallet.address));
								node.roleLookup().then(function(rl) {
									rl.relations(node.wallet.address,42).then(function(tx) {
										open_username(node);
									});
								});	
							});
						});
					});
				}
			});
		});
	});
});	


function refreshGSI() {
	
	$.get("https://stromdao.de/crm/service/gsi/?plz="+plz,function(data) {
		var data=JSON.parse(data);	
		var gsi=JSON.parse(data.data.gsi);
		var html="";
		var html_t="<tr>";
		var html_v="<tr>";
		var html_tr="";
		console.log(data.data);
		$('.plz').html(data.data.plz);
		$('#time').html(new Date(data.data.time).toLocaleString());
		var i=0;
		$.each(gsi,function(a,b) {
			var color="#ffffff";
			if(b.eevalue>70) color="#CDECFF";
			if(b.value<1) color="#FFDFDF";
			if(new Date(b.epochtime*1000).getTime()>new Date().getTime()) {
				i++;
				if(i<14) {
				html_t+="<td style='background-color:"+color+";text-align:right'>";			
				if((""+new Date(b.epochtime*1000).getHours()).length<2) html_t+="0";
					html_t+=new Date(b.epochtime*1000).getHours()+":00</td>";
					html_v+="<td style='background-color:"+color+";text-align:right'>"+(b.value/1000000000).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })+"</td>";
				}
				html_tr+="<tr>";
				html_tr+="<td>"+new Date(b.epochtime*1000).getHours()+":00</td>";
				html_tr+="<td style='background-color:"+color+";text-align:right'>"+(b.eevalue)+"%</td>";
				html_tr+="<td style='background-color:"+color+";text-align:right'>"+(b.price.microCentPerWh/100000000).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })+"€</td>";
				html_tr+="</tr>";
			}						
		});
		//html_t+="</tr>";
		//html_v+="</tr>";
		//html+=html_t;
		//html+=html_v;
		html+=html_tr;
		$('#gsi_table').html(html);
	});	
} 

/* Your APP Goes here */
function updateGSI(callback) {
	$.get("https://stromdao.de/crm/service/gsi/?plz="+plz,function(data) {
			var json=JSON.parse(data);
			//  Validate Signature
			if(json.hash!=node.hash(json.data)) {
			  console.error("Hash check failed");
			  return;	
			}
			if(json.by!=node.verify(json.signature)) {
			  console.error("Signer check failed");
			  return;	
			}
			if(json.by!="0xEe5D4A98Ca5A77b5245Af9F235Eab4CB405be185") {
			  console.error("Wrong Signer");
			  return;	
			}	
			node.storage.setItemSync("gsi",data);
			console.log("GSI Updated");
			if(typeof callback != "undefined") {
					callback(json);
			}
	});			
}


function storeReading(gsi) {
	$('#sessionmeter').hide();
	node.mpr().then(function(mpr) {
		mpr.readings(node.wallet.address).then(function(o) {
				$('#reading').val(o.power);
				last_reading=o;
		});
	});
	
	$('#go').on('click',function() {		
		$('#go').attr('disabled','disabled');	
		node.mpr().then(function(mpr) {			
			mpr.storeReading($('#reading').val()).then(function(o) {	
					mpr.readings(node.wallet.address).then(function(o) {
						$('#go').removeAttr('disabled');
						$('#gridmeter').hide();
						if(typeof gsi!="undefined") {
								gsi_start=JSON.parse(gsi);
								gsi_start=JSON.parse(gsi_start.data.gsi);																
								$('#reading2').val(0);
								$('#carmeter').show();	
								$('#sessionmeter').hide();					
								$('#go2').on('click',function() {							
									$('#carmeter').hide();	
									$('#sessionmeter').hide();						
									$('#confirmation').show();
									var html="";
									html+="<tr><th>Beginn</th><td>"+new Date(last_reading.time*1000).toLocaleString()+"</td></tr>";
									html+="<tr><td>Zählerstand</td><td>"+last_reading.power+" Wh</td></tr>";
									html+="<tr><th>Ende</th><td>"+new Date(o.time*1000).toLocaleString()+"</td></tr>";
									html+="<tr><td>Zählerstand</td><td>"+o.power+" Wh</td></tr>";
									html+="<tr><td>Bezogene Energiemenge (Netz)</td><td>"+(o.power-last_reading.power)+" Wh</td></tr>";
									html+="<tr><td>Autostrom am Netzanschluss</td><td>"+($('#reading2').val())+" Wh</td></tr>";
									var delta_t=(o.time-last_reading.time)/3600;									
									html+="<tr><td>Dauer</td><td>"+(delta_t).toLocaleString(undefined, { minimumFractionDigits:1, maximumFractionDigits:1 })+" Stunden</td></tr>";
								    var start_ee=gsi_start[0];	
								    var ee_val=gsi_start[0].value;
								    var ee_cnt=1;
								    $.each(gsi_start,function(a,b) {																						
											if(b.epochtime<last_reading.time) {
													start_ee=b;
											} else {
												if(b.epochtime<o.time) {
													ee_val+=b.value;
													ee_cnt++;
												}												
											}
									});
									var ee_prm=0;
									if(ee_cnt==0) {
										html+="<tr><td>Prämie</td><td>Nicht berechtigt</td></tr>";
									} else {
										ee_prm=((ee_val/ee_cnt)*($('#reading2').val()/1000))/100;
										html+="<tr><td>Prämie</td><td>"+(ee_prm/10000000).toLocaleString(undefined, { minimumFractionDigits:4, maximumFractionDigits:4 })+" €</td></tr>";
									}	
									updateGSI(function(gsi_end) {
										$('#sessionmeter').hide();
										var receipt={};
										receipt.start = {};
										receipt.start.gsi=gsi;
										receipt.start.time = last_reading.time;
										receipt.start.power = last_reading.power;
										receipt.end={};
										receipt.end.gsi=gsi_end;
										receipt.end.time=o.time;
										receipt.end.power=o.power;
										receipt.value = {};
										receipt.value.power=$('#reading2').val();
										receipt.value.ee = ee_val;
										receipt.value.bonus = ee_prm;
										receipt.value.cnt = ee_cnt;
										node.storage.setItemSync("gsi",null); 
										console.log("Raw Receipt to sign",receipt);
										$('#confirmation_table').html(html);
										$('#go3').click(function() {
											$('#sessionmeter').hide();
										
												var msg={};
												msg.by=node.wallet.address;
												msg.data=JSON.stringify(receipt);
												msg.hash=node.hash(msg.data);
												msg.signature=node.sign(msg.data);
												console.log("Signed Receipt",msg);
												$('#confirmed').show();
												$('#go4').attr('disabled','disabled');												
												$('#confirmation').hide();
												$.post("https://stromdao.de/crm/service/gsi/receipt/",{json:JSON.stringify(msg)},function(d) {
														console.log("Quittance",d);
														d=JSON.parse(d);
														var html="";
														html+="<tr><td>IPFS Hash</td><td>"+d.ipfs_hash+"</td></tr>";
														html+="<tr><td>Energy Chain</td><td><a href='https://www.stromkonto.net/?account="+node.wallet.address+"&sc="+d.blg+"' target=_blank>"+d.bc+"</a></td></tr>";
														html+="<tr><td>Transaktion</td><td>"+d.tx+"</td></tr>";
														$('#confirmed_table').html(html);
														$('#donemark').html("Vorgang abgeschlossen");
														$('#go4').removeAttr('disabled');
														$('#go4').click(function() {
																$('#confirmed').hide();
																$('#sessionmeter').show();
														});
												});																							  											

										});
									});								
								});
						} else {
								$('#sessionmeter').show();
						}
					});
			});
		});	
	});	
	$('#gridmeter').show();
	$('#sessionmeter').hide();
}
function startSession() {
	storeReading();
	updateGSI(updateState);	
}

function endSession() {
	var gsi=node.storage.getItemSync("gsi");
	node.storage.setItemSync("gsi",null);	
	updateState();
	storeReading(gsi);
}

function updateState() {
	if((node.storage.getItemSync("gsi")!=null)&&(node.storage.getItemSync("gsi")!="null")) {
		var gsi = JSON.parse(node.storage.getItemSync("gsi"));
		if(gsi.data.time<(new Date().getTime())-8640000) {
			$('#start_session').removeAttr('disabled');
			$('#end_session').attr('disabled','disabled');
		} else {			
			$('#start_session').attr('disabled','disabled');
			$('#end_session').removeAttr('disabled');		
		}
	} else {
		$('#start_session').removeAttr('disabled');
		$('#end_session').attr('disabled','disabled');
	}
	
}
function app() {
	refreshGSI();
	$('#meterpointaddress').val(node.wallet.address);
	$('#start_session').click(startSession);
	$('#end_session').click(endSession);	
	updateState();
	
}
if(node.storage.getItemSync("plz")!=null) {
		$('#plz').val(node.storage.getItemSync("plz"));
}
$('#open_gsi').click(function() {		
		plz=$('#plz').val();
		node.storage.setItemSync("plz",plz);
});
