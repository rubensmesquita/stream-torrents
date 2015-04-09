// Verifica se vc esta conectado ao btapp
var btapp = new Btapp;
	btapp.connect({
		product: 'Torque' // Torque programa utilizado para o stream dos torrents
	});

// Converte os bytes baixados
function bytesToSize(bytes) {
   if (bytes == 0) return '';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2);
}

// Inicia e Pausa o torrent
function toggleState(item, hash){
	
    if(item.className == "on"+hash+" on") {
    	// Inicia o download do torrent
        item.className="off"+hash+" off";
        $("#btn-"+hash).attr('value', 'Stop download');
		btapp.live('torrent * properties download_url', function(download_url, properties, torrent) {	
			btapp.get("torrent").get(hash).start();
		});

    } else {
    	// Pausa o download do torrent
        item.className="on"+hash+" on";
        $("#btn-"+hash).attr('value', 'Start download');
		btapp.live('torrent * properties download_url', function(download_url, properties, torrent) {
			btapp.get("torrent").get(hash).stop();
		});
    }

}

// Remover o torrent da lista

function remover(hash, id){	
	
	btapp.live('torrent * properties download_url', function(download_url, properties, torrent) {
		btapp.get("torrent").get(hash).remove(Btapp.TORRENT.REMOVE.DELETE_TORRENT_AND_DATA);
	});

	$('#'+id).fadeOut(500, function() { $('#'+id).remove(); });

}

// Lista todos os torrents que estão em downloads
btapp.live('torrent * properties download_url', function(download_url, properties, torrent) {

	var added_on 	= properties.get('added_on');
	var value 		= properties.get('name'); // Nome do torrent
	var size 		= properties.get('size'); // Tamanho do torrent
	var progress 	= properties.get('size'); // -- // 
	var hash_get    = properties.get('hash');	// Hash do torrent

	// Inicia o download de todos os torrents na fila
	btapp.get("torrent").get(hash_get).start();

	setInterval(function(){
		var prog 				= properties.get('downloaded');
		var progress_get 		= Math.floor((prog / progress) * 100)+ "%"; // Mostra o progresso do download
		
		// Progress bar download torrents
		$('#progress'+added_on).html('<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: '+progress_get+';"></div>');	
				
		var downloaded 			= properties.get('downloaded'); // Download realizado
		var uploaded 			= properties.get('uploaded'); // Upload realizado
		var peers_connected 	= properties.get('peers_connected'); // Peers conectados
		var peers_in_swarm  	= properties.get('max_peer_connections'); // Máximo de conecções permitidas
		var queue_order 		= properties.get('queue_order');  // Queue order
		var download_speed  	= Math.ceil(10 * properties.get('download_speed') / 1024) / 10; // Velocidade do download
		var upload_speed   		= Math.ceil(10 * properties.get('upload_speed') / 1024) / 10; // Velocidade do upload

		// Mostra os status do torrent.
		$('#stats'+added_on).html('<strong>Speed:</strong> <span class="label label-success ng-binding">'+download_speed+'</span> / <span class="label label-danger ng-binding">'+upload_speed+'</span> KB/s | <strong>Traffic:</strong> <span class="label label-success ng-binding">'+bytesToSize(downloaded)+'</span> / <span class="label label-danger ng-binding">'+bytesToSize(uploaded)+'</span> MB | <strong>Peers:</strong> <span class="label label-success ng-binding">'+peers_connected+'</span> / <span class="label label-default ng-binding">'+peers_in_swarm+'</span> | <strong>Queue:</strong> <span class="label label-primary ng-binding">'+queue_order+'</span> <div class="torrent-status"></div>');

	}, 500);
	
	// Lista todos os torrents que estão na fila do download
	$('#list-torrents').prepend('<div id="'+added_on+'" class="ob-list"><div class="title-ob"> '+value+' <div id="remover-'+hash_get+'" class="ob-delete" onclick="remover(\''+hash_get+'\', \''+added_on+'\')"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></div> <input type="button" id="btn-'+hash_get+'" value="Stop download" class="off'+hash_get+' off" onclick="toggleState(this, \''+hash_get+'\')" /></div> <div class="list-files"><ul class="list-group" id="list-t'+hash_get+'"></ul></div><div id="progress'+added_on+'" class="progress"></div><div id="stats'+added_on+'" class="panel-footer"> </div></div>');

	// Lista todos os arquivos que existem dentro do torrent adicionado.
	var listItems = btapp.get("torrent").get(hash_get).get('file');
	listItems.each(function(file) {
	    console.log(file.get('properties').get('name'));
	    if(file.get('properties').get('name')){
	    	$('#list-t'+hash_get).append('<li class="list-group-item"><span class="glyphicon glyphicon-cloud-download" aria-hidden="true"></span><a href="'+file.get('properties').get('streaming_url')+'"> '+file.get('properties').get('name')+'</a></li>');
	    }else{
	    	$('#list-t'+hash_get).append('<div class="load"></div>');
	    }
	});

});

// Adiciona o torrent por magnet link
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