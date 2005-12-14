dump('entering circ.checkin.js\n');

if (typeof patron == 'undefined') patron = {};
circ.checkin = function (params) {

	JSAN.use('util.error'); this.error = new util.error();
	JSAN.use('util.network'); this.network = new util.network();
	this.OpenILS = {}; JSAN.use('OpenILS.data'); this.OpenILS.data = new OpenILS.data(); this.OpenILS.data.init({'via':'stash'});
}

circ.checkin.prototype = {

	'init' : function( params ) {

		var obj = this;

		obj.session = params['session'];

		JSAN.use('circ.util');
		var columns = circ.util.columns( 
			{ 
				'barcode' : { 'hidden' : false },
				'title' : { 'hidden' : false },
				'status' : { 'hidden' : false },
			} 
		);
		dump('columns = ' + js2JSON(columns) + '\n');

		JSAN.use('util.list'); obj.list = new util.list('checkin_list');
		obj.list.init(
			{
				'columns' : columns,
				'map_row_to_column' : circ.util.std_map_row_to_column,
			}
		);
		
		JSAN.use('util.controller'); obj.controller = new util.controller();
		obj.controller.init(
			{
				'control_map' : {
					'checkin_barcode_entry_textbox' : [
						['keypress'],
						function(ev) {
							if (ev.keyCode && ev.keyCode == 13) {
								obj.checkin();
							}
						}
					],
					'cmd_broken' : [
						['command'],
						function() { alert('Not Yet Implemented'); }
					],
					'cmd_checkin_submit_barcode' : [
						['command'],
						function() {
							obj.checkin();
						}
					],
					'cmd_checkin_print' : [
						['command'],
						function() {
						}
					],
					'cmd_checkin_reprint' : [
						['command'],
						function() {
						}
					],
					'cmd_checkin_done' : [
						['command'],
						function() {
						}
					],
				}
			}
		);
		this.controller.view.checkin_barcode_entry_textbox.focus();

	},

	'checkin' : function() {
		var obj = this;
		try {
			var barcode = obj.controller.view.checkin_barcode_entry_textbox.value;
			var checkin = obj.network.request(
				api.checkin_via_barcode.app,
				api.checkin_via_barcode.method,
				[ obj.session, barcode, obj.patron_id ]
			);
			obj.list.append(
				{
					'row' : {
						'my' : {
						'circ' : checkin.circ,
						'mvr' : checkin.record,
						'acp' : checkin.copy
						}
					}
				//I could override map_row_to_column here
				}
			);
			if (typeof obj.on_checkin == 'function') {
				obj.on_checkin(checkin);
			}
			if (typeof window.xulG == 'object' && typeof window.xulG.on_checkin == 'function') {
				obj.error.sdump('D_CIRC','circ.checkin: Calling external .on_checkin()\n');
				window.xulG.on_checkin(checkin);
			} else {
				obj.error.sdump('D_CIRC','circ.checkin: No external .on_checkin()\n');
			}

		} catch(E) {
			alert('FIXME: need special alert and error handling\n'
				+ js2JSON(E));
			if (typeof obj.on_failure == 'function') {
				obj.on_failure(E);
			}
			if (typeof window.xulG == 'object' && typeof window.xulG.on_failure == 'function') {
				obj.error.sdump('D_CIRC','circ.checkin: Calling external .on_failure()\n');
				window.xulG.on_failure(E);
			} else {
				obj.error.sdump('D_CIRC','circ.checkin: No external .on_failure()\n');
			}
		}

	},

	'on_checkin' : function() {
		this.controller.view.checkin_barcode_entry_textbox.value = '';
		this.controller.view.checkin_barcode_entry_textbox.focus();
	},

	'on_failure' : function() {
		this.controller.view.checkin_barcode_entry_textbox.select();
		this.controller.view.checkin_barcode_entry_textbox.focus();
	}
}

dump('exiting circ.checkin.js\n');
