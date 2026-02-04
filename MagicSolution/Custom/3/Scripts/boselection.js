var associations = {
    'DO_DOCUME_DO_TIPDOC_ID': { table: 'core.DO_OBTIDO_type_document', filterField: 'DO_OBTIDO_DO_TIPDOC_ID', BOTypeField: 'DO_OBTIDO_BusinessObjectType_ID' }
};

function getBOTypeFilter(e) {
    var info = associations[$(e.sender.element[0]).attr('name')];
    var id = e.sender.value();
    setBOFilters(info, id);
}

function setBOFilters(info, id) {
	let par = {
		storedProcedureName: "core.DO_USP_GET_OBTIDO_TYP_DOC",
		data: {}
	};
	par.data[info.filterField] = id; 
    requireConfigAndMore(["MagicSDK"], function (MF) {
		MF.api.get(par)  
           .then(function (result) {
			   if (result.length > 0 && result[0].length) {
                   var filter = [];
                   $.each(result[0], function (k, v) {
                       filter.push(v[info.BOTypeField]);
                   });
                   $('#tabstrippopup .bo-tagbox').bOSelector('setFilter', filter);
               }
               else {
                   $('#tabstrippopup .bo-tagbox').bOSelector('deleteFilter');
               }
           }, function (err) {
               console.log(err);
           });
    });
}

function setBOLinkedEntity(entityName, refValueid,model)
{

    let oEntity = { entityName: entityName, refValueId: refValueid };

    if (model) {
        Object.assign(oEntity, model.toJSON());
    }
    $('#tabstrippopup .bo-tagbox').bOSelector('setEntity', oEntity);
    //$('#tabstrippopup .bo-tagbox').bOSelector('setEntity', { entityName:entityName, refValueId: refValueid });
}

function getBoTypeFilterFieldKey(id, associationsKey) {
    var info = associations[associationsKey];
    setBOFilters(info, id);
}