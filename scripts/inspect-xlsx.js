var XLSX = require('xlsx');
var wb = XLSX.readFile('Documents/MASTER contabilidad 2026.xlsx');
var gastos = XLSX.utils.sheet_to_json(wb.Sheets['Gastos'], { header:1, defval:null, raw:true });

var headerRows = [4, 11, 17, 23, 29, 44, 54, 67, 72, 77];
headerRows.forEach(function(startR) {
  console.log('\n--- Section starting at R'+startR+' ---');
  for (var i = startR; i < Math.min(startR+20, gastos.length); i++) {
    var r = gastos[i];
    if (!r) continue;
    var a = r[0] != null ? String(r[0]).trim() : '';
    var b = r[1] != null ? r[1] : '';
    var c = r[2] != null ? r[2] : '';
    var d = r[3] != null ? r[3] : '';
    var e = r[4] != null ? r[4] : '';
    console.log('  R'+i+': ['+a+'] | ['+b+'] | ['+c+'] | ['+d+'] | ['+e+']');
  }
});

// Also show Consolidado rows 10-35 to understand sub-structure
var cons = XLSX.utils.sheet_to_json(wb.Sheets['Consolidado'], { header:1, defval:null, raw:true });
console.log('\n\n=== CONSOLIDADO rows 0-40 ===');
for (var i = 0; i < 40; i++) {
  var r = cons[i];
  if (!r) continue;
  var cells = [];
  for (var j = 1; j < 15; j++) {
    cells.push(r[j] != null ? String(r[j]).substring(0,20) : '');
  }
  console.log('  R'+i+': ' + cells.join(' | '));
}

// Proyeccion rows 0-35
var proy = XLSX.utils.sheet_to_json(wb.Sheets['Proyección'], { header:1, defval:null, raw:true });
console.log('\n\n=== PROYECCION rows 0-40 ===');
for (var i = 0; i < 40; i++) {
  var r = proy[i];
  if (!r) continue;
  var cells = [];
  for (var j = 0; j < 14; j++) {
    cells.push(r[j] != null ? String(r[j]).substring(0,20) : '');
  }
  console.log('  R'+i+': ' + cells.join(' | '));
}
