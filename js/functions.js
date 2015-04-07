// Connect btapp
var btapp = new Btapp;
	btapp.connect({
		product: 'Torque'
	});


function bytesToSize(bytes) {
   if (bytes == 0) return '';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2);
}

function toggleState(item, hash){
    if(item.className == "on"+hash+" on") {
        item.className="off"+hash+" off";
        $("#btn-"+hash).attr('value', 'Stop download');
		btapp.live('torrent * properties download_url', function(download_url, properties, torrent) {	
			btapp.get("torrent").get(hash).start();
		});

    } else {
        item.className="on"+hash+" on";
        $("#btn-"+hash).attr('value', 'Start download');
		btapp.live('torrent * properties download_url', function(download_url, properties, torrent) {
			btapp.get("torrent").get(hash).stop();
		});
    }
}

// Remover torrent list

function remover(hash, id){	
	
	btapp.live('torrent * properties download_url', function(download_url, properties, torrent) {
		btapp.get("torrent").get(hash).remove(Btapp.TORRENT.REMOVE.DELETE_TORRENT_AND_DATA);
	});

	$('#'+id).fadeOut(500, function() { $('#'+id).remove(); });

}


// List torrents front end

btapp.live('torrent * properties download_url', function(download_url, properties, torrent) {

	var added_on 	= properties.get('added_on');
	var value 		= properties.get('name');
	var size 		= properties.get('size');
	var progress 	= properties.get('size');
	var hash_get    = properties.get('hash');

	btapp.get("torrent").get(hash_get).start();

	setInterval(function(){
		var prog 				= properties.get('downloaded');
		var progress_get 		= Math.floor((prog / progress) * 100)+ "%";
		
		// Progress bar download torrents
		$('#progress'+added_on).html('<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: '+progress_get+';"></div>');	
				
		var eta 				= properties.get('eta');
		var downloaded 			= properties.get('downloaded');
		var uploaded 			= properties.get('uploaded');
		var peers_connected 	= properties.get('peers_connected');
		var peers_in_swarm  	= properties.get('max_peer_connections');
		var queue_order 		= properties.get('queue_order');
		var download_speed  	= Math.ceil(10 * properties.get('download_speed') / 1024) / 10;
		var upload_speed   		= Math.ceil(10 * properties.get('upload_speed') / 1024) / 10;

		// Stats torrent list
		$('#stats'+added_on).html('<strong>Speed:</strong> <span class="label label-success ng-binding">'+download_speed+'</span> / <span class="label label-danger ng-binding">'+upload_speed+'</span> KB/s | <strong>Traffic:</strong> <span class="label label-success ng-binding">'+bytesToSize(downloaded)+'</span> / <span class="label label-danger ng-binding">'+bytesToSize(uploaded)+'</span> MB | <strong>Peers:</strong> <span class="label label-success ng-binding">'+peers_connected+'</span> / <span class="label label-default ng-binding">'+peers_in_swarm+'</span> | <strong>Queue:</strong> <span class="label label-primary ng-binding">'+queue_order+'</span> <div class="torrent-status"></div>');

	}, 500);

	
	// Select file (mp4)
	torrent.get('file').each(function(file) {	
				
		var name = file.get('properties').get('name');
		var ext = name.substr(name.lastIndexOf('.') + 1);
			    
		if(ext == 'mp4') {

			var stream_srt = file.get('properties').get('streaming_url');	
			$('#list-torrents').append('<div id="'+added_on+'" class="ob-list"><div class="title-ob"> <a class="title-ob-a" href="'+stream_srt+'"> '+value+'</a> <div id="remover-'+hash_get+'" class="ob-delete" onclick="remover(\''+hash_get+'\', \''+added_on+'\')"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></div> <input type="button" id="btn-'+hash_get+'" value="Stop download" class="off'+hash_get+' off" onclick="toggleState(this, \''+hash_get+'\')" /></div><div id="progress'+added_on+'" class="progress"></div><div id="stats'+added_on+'" class="panel-footer"> </div></div>');
				
		}

	});

});

// Add torrent by magnet link
$(document).ready(function(){
    $("button").click(function(){
       
        var data = $("#input-add").val();
        if(data){
        	btapp.live('add', function(add) {
			  add.torrent({
			    url: data,
			    priority: Btapp.TORRENT.PRIORITY.METADATA_ONLY
			  });
			});	
        	$("#input-add").val('');
        }

    });
});