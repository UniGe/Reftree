
    function editPosizioniOrdini(e) {
        //the key is a field that will trigger reload  of the values which binded to dropdowns
        var automationsForDrops = {
            Product_ID: ["ProductAttributeSize_ID", "ProductAttributeColor_ID"],
            Size: ["ProductAttributeColor_ID"]
        };
        if (e.model.Width <= 0) //Nascondo il campo dalla popup  se non è stato settato
            e.container.find("[name='Width']").closest("[class*=col-]").hide(); 

        if (e.model.Length <= 0)  //Nascondo il campo dalla popup  se non è stato settato
            e.container.find("[name='Length']").closest("[class*=col-]").hide(); 

        WMSJournalProductInit(e);
        var gridname = e.sender.element.attr("id");
        var promise = getStandardEditFunction(e, null, gridname);
        var gridDs = e.sender.dataSource;
        $.when(promise).then(function () {
            gridDs.bind('change', function (ev) {
                $.each(automationsForDrops, function (key, value) {
                    if (key == ev.field) {
                        $.each(value, function (i, v) {
                            var $kendodrop = e.container.find("[name=" + v + "]");
                            var kdrop = $kendodrop.data("kendoDropDownList");
                            var dsInfo = e.sender.options.dataSource.schema.model.fields[$kendodrop.attr("name")].dataSourceInfo;
                            getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $kendodrop.attr("id"), ev.items[0][v], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, ev.items[0], false, null, null, false, e.container);
                        });
                    }
                });
            });
        });
    }

    function editPosizioniWMSJournal(e) {  //Toggle Dimension Drop Value & Visiblity  -- used in Journal Position Edit -- Prorpietà griglia: Funzione JS: editPosizioniWMSJournal
        //the key is a field that will trigger reload  of the values which binded to dropdowns
        var automationsForDrops = {
            InventLocation_ID_From: ["Location_ID_From"], //, "Color"],
            InventLocation_ID_To: ["Location_ID_To"],
            Product_ID: ["ProductAttributeSize_ID", "ProductAttributeColor_ID", "ProductAttributeBatch_ID"], //, "ProductTypeAssociation_ID"],
            Location_ID_To: ["ProductAttributeBatch_ID"],
            Location_ID_From: ["ProductAttributeBatch_ID"],
            ProductAttributeSize_ID: ["ProductAttributeBatch_ID"],
            ProductAttributeColor_ID: ["ProductAttributeBatch_ID"]
           
            
            //Size: ["Color"]
        };

        //WMSJournalProductInit(e,0);
        //var gridname = e.sender.element.attr("id");
        var gridname = currentgrid;

        var promise = getStandardEditFunction(e, null, gridname);
        var gridDs = e.sender.dataSource;
        $.when(promise).then(function () {
            gridDs.bind('change', function (ev) {
                $.each(automationsForDrops, function (key, value) {
                    if (key == ev.field) {
                        $.each(value, function (i, v) {
                            var $kendodrop = e.container.find("[name=" + v + "]");
                            var kdrop = $kendodrop.data("kendoDropDownList");
                            var dsInfo = e.sender.options.dataSource.schema.model.fields[$kendodrop.attr("name")].dataSourceInfo;
                            getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $kendodrop.attr("id"), ev.items[0][v], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, ev.items[0], false, null, null, false, e.container);
                        });
                    }
                });
            });
        });
        initWMSJournal(e);
    }



    function initWMSJournal(e) {
    /*
        if (e.sender && e.sender.element)
            e = e.sender.element;
        var dataInfo = getModelAndContainerFromKendoPopUp(e);
        var model = dataInfo.model;
        var container = dataInfo.container;
        */

        var dataInfo = e; // getModelAndContainerFromKendoPopUp(e);
        var model = dataInfo.model;
        if (model == undefined) {
            model = this.gridineditdatasourcemodel;
        }
        var container = dataInfo.container;

        var typeinit = model.JournalKey_ID;

        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "WMS.GetJournalType", data: { ID: model.WMSJournalHeader_ID} }).then(function (res) {

                var type = res[0][0].JournalKey_ID;

                    if (type == 4) {
                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").show();
                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").attr("required", "true");
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").show();
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").attr("required", "true");
                       
                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").attr("required", "true");
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").attr("required", "true");

                        return;
                    }

                    if (type == 3) {
                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").show();
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").hide();
                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").attr("required", "true"); 
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").removeAttr('required');

                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").attr("required", "true");
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").removeAttr('required');

                    }
                    
                    if ((type == 1) || (type == 7)) {
                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").hide(); 
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").show();
                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").removeAttr('required');
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").attr("required", "true");

                        container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").removeAttr('required');
                        container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").attr("required", "true"); 

                    }

            })
        })


        /*

        if (type == 4) {
            container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").show(); //nascondi
            container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").show(); //nascondi

            return;
        }

        if (type == 3) {
            container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").show(); //nascondi
            container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").hide(); //nascondi

        }

        if ((type == 1) || (type == 7)) {
            container.find("[name='Location_ID_From'], [name='InventLocation_ID_From']").closest("[class*=col-]").hide(); //nascondi
            container.find("[name='Location_ID_To'], [name='InventLocation_ID_To']").closest("[class*=col-]").show(); //nascondi
            
        }

        */

     
    }

    function editPosizioniWMSProduct(e) {  //Toggle Dimension Drop Value & Visiblity  -- used in Product Edit -- Prorpietà griglia: Funzione JS: editPosizioniWMSProduct
        //the key is a field that will trigger reload  of the values which binded to dropdowns
        var automationsForDrops = {

            Product_ID: ["ProductAttributeSize_ID", "ProductAttributeColor_ID"],
            InventLocation_ID: ["Default_Location_ID", "Input_Location_ID", "Output_Location_ID"]

        };

        WMSJournalProductInit(e);
        var gridname = e.sender.element.attr("id");
        var promise = getStandardEditFunction(e, null, gridname);
        var gridDs = e.sender.dataSource;
        $.when(promise).then(function () {
            gridDs.bind('change', function (ev) {
                $.each(automationsForDrops, function (key, value) {
                    if (key == ev.field) {
                        $.each(value, function (i, v) {
                            var $kendodrop = e.container.find("[name=" + v + "]");
                            var kdrop = $kendodrop.data("kendoDropDownList");
                            var dsInfo = e.sender.options.dataSource.schema.model.fields[$kendodrop.attr("name")].dataSourceInfo;
                            getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $kendodrop.attr("id"), ev.items[0][v], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, ev.items[0], false, null, null, false, e.container);
                        });
                    }
                });
            });
        });

    }

    function editWMSProductLocation(e) {  //Toggle Dimension Drop Value & Visiblity  -- used in Journal Position Edit -- Prorpietà griglia: Funzione JS: editPosizioniWMSJournal
        //the key is a field that will trigger reload  of the values which binded to dropdowns
        var automationsForDrops = {
            //InventLocation_ID_From: ["Location_ID_From"], //, "Color"],
            //InventLocation_ID_To: ["Location_ID_To"],
            Product_ID: ["ProductAttributeSize_ID", "ProductAttributeColor_ID"], //, "ProductAttributeBatch_ID"] //, "ProductTypeAssociation_ID"],
            //Location_ID_To: ["ProductAttributeBatch_ID"],
            //Location_ID_From: ["ProductAttributeBatch_ID"],
            ProductAttributeSize_ID: ["ProductAttributeColor_ID"],
            ProductAttributeColor_ID: ["ProductAttributeSize_ID"],
            InventLocation_ID: ["Default_Location_ID", "Input_Location_ID", "Output_Location_ID"]
            //Size: ["Color"]
        };

        WMSJournalProductInit(e);
        var gridname = e.sender.element.attr("id");
        var promise = getStandardEditFunction(e, null, gridname);
        var gridDs = e.sender.dataSource;
        $.when(promise).then(function () {
            gridDs.bind('change', function (ev) {
                $.each(automationsForDrops, function (key, value) {
                    if (key == ev.field) {
                        $.each(value, function (i, v) {
                            var $kendodrop = e.container.find("[name=" + v + "]");
                            var kdrop = $kendodrop.data("kendoDropDownList");
                            var dsInfo = e.sender.options.dataSource.schema.model.fields[$kendodrop.attr("name")].dataSourceInfo;
                            getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $kendodrop.attr("id"), ev.items[0][v], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, ev.items[0], false, null, null, false, e.container);
                        });
                    }
                });
            });
        });

    }


    function editWMSJournal(e) {
        getStandardEditFunction(e, e.options.code, "grid");
        managdimension(e.model.ProductTypeAssociation_ID, e.container, 0);
    }

    function managedefaultProductValue(type, $element, init,model) {
       
        //container.find("[name=UnitMeasure_ID]").data("kendoDropDownList").value(UnitMeasure_ID);
        var unitmeasuredrop = $("[name='UnitMeasure_ID']").data("kendoDropDownList");
     //   unitmeasuredrop.value(type);

        $element.find("[name=UnitMeasure_ID]").data("kendoDropDownList").value(type);
        model["UnitMeasure_ID"] = type;
        model.dirty = true;

    }

    function CompleteDelivery(e, init) {
 


        if (init == 1) {

            requireConfigAndMore(["MagicSDK"], function (MF) {
                MF.api.get({ storedProcedureName: "WMS.GetDocumentBaseType", data: { DocumentBase_ID: e.model.DocumentBase_ID } }).then(function (res) {
                    if (res.length) {             
                    
                        var Code = res[0][0].Code;
                    
                
                        if (Code)
                        {

                            if (Code=="FA")
                            {
                                manageCompleteDeliveryInit(e, e.container);
                            }
                        }
            
                    }

                })
            })

           
        }
    
    }

    function manageCompleteDeliveryInit(e, $element, init, model) {
        checked = "checked='checked'";

       e.container.find("[name='CompleteDelivery']").prop("checked", checked);



    }
    function managdimension(type, $element, init) {


        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "WMS.[GetWMSProductAttributeType]", data: { ProductTypeAssociation_ID: type } }).then(function (res) {
                if (res.length != 0) {//FA
                    var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;
                    var ColorActive = res[0][0].ColorActive;
                    var SizeActive = res[0][0].SizeActive;
                    var ConfigurationActive = res[0][0].ConfigurationActive;
                    var SerialActive = res[0][0].SerialActive;
                    var Active = res[0][0].Active;
                    var SingleBatchActive = res[0][0].SingleBatchActive;
                    var BatchActive = res[0][0].BatchActive;

                    var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
                    //$element.find("[name='Length'], [name='ProductAttributeSize_ID']").closest("[class*=col-]").hide();
                    $element.find("[name='ProductAttributeColor_ID']").removeAttr('required');
                    dropdownlist.enable(false);

                    var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
                    //$element.find("[name='Length'], [name='ProductAttributeColor_ID']").closest("[class*=col-]").hide();
                    $element.find("[name='ProductAttributeColor_ID']").attr('required');
                    dropdownlist1.enable(false);

                    var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
/*
                    var dropdownlist3 = $("[name='Serial']").data("kendoDropDownList");
                    //$element.find("[name='Length'], [name='ProductAttributeSize_ID']").closest("[class*=col-]").hide();
                    $element.find("[name='Serial']").removeAttr('required');
                    dropdownlist3.enable(false);
                    */
                    var SerialId = $("input[name=SerialId]").closest("div.k-edit-field")
                    //$element.find("[name='Length'], [name='ProductAttributeSize_ID']").closest("[class*=col-]").hide();
                    $element.find("input[name=SerialId]").attr("readOnly", "true");
                    $element.find("input[name=SerialId]").removeAttr("required");
                    //dropdownlist3.editable(false);

                    //e.container.find("input[name=" + k + "]").data("kendoDropDownList").enable(false);

                    if (dropdownlist2) {
                        $element.find("[name='ProductAttributeBatch_ID']").removeAttr('required');
                        //  $element.find("[name='Length'], [name='ProductAttributeBatch_ID']").closest("[class*=col-]").show();
                        dropdownlist2.enable(false);
                    }

                    if (ColorActive == 1) {
                        $element.find("[name='ProductAttributeColor_ID']").attr("required", "true");
                        // $element.find("[name='Length'], [name='ProductAttributeColor_ID']").closest("[class*=col-]").show();
                        dropdownlist1.enable(true);

                    }

                    if (SizeActive == 1) {
                        $element.find("[name='ProductAttributeSize_ID']").attr("required", "true");
                        // $element.find("[name='Length'], [name='ProductAttributeSize_ID']").closest("[class*=col-]").show();
                        dropdownlist.enable(true);

                    }

                    if ((BatchActive == 1 || SingleBatchActive == 1) && dropdownlist2) {
                        //$element.find("[name='ProductAttributeBatch_ID']").attr("required", "true");
                        $element.find("[name='Length'], [name='ProductAttributeBatch_ID']").closest("[class*=col-]").show();
                        dropdownlist2.enable(true);

                    }
                    /*
                    if (SerialActive == 1) {
                        $element.find("[name='Serial']").attr("required", "true");
                        // $element.find("[name='Length'], [name='ProductAttributeSize_ID']").closest("[class*=col-]").show();
                        dropdownlist3.enable(true);

                    }
                    */
                    if (SerialActive == 1) {
                        $element.find("input[name=SerialId]").attr("required", "true");
                        $element.find("input[name=SerialId]").removeAttr("readOnly");
                        // $element.find("[name='Length'], [name='ProductAttributeSize_ID']").closest("[class*=col-]").show();
                        //dropdownlist3.editable(true);

                    }
                    if (init == 1) {
                        dropdownlist.value(null);
                        dropdownlist1.value(null);
                        if (dropdownlist2) {
                            dropdownlist2.value(null);
                        }
                        //       dropdownlist2.value(null);
                    }
                }
            })
        })

    }
            

    function managdimension_old(type, $element, init) {

        var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
        dropdownlist.enable(false);
        var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
        dropdownlist1.enable(false);
        // DB 03/07/2018: non c'è questo campo
        //var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
        //dropdownlist2.enable(false);

        if ((type == 1) || (type == undefined)) { //senza dimensioni

            var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").removeAttr('required');

            dropdownlist.enable(false);
            var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").removeAttr('required');
            dropdownlist1.enable(false);

            //       var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
            //       dropdownlist2.enable(false);

        }


        if ((type == 2) || (type == undefined)) { //solo colore

            var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").removeAttr('required');
            dropdownlist.enable(false);
            var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").attr("required", "true");
            dropdownlist1.enable(true);
            //       var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
            //       dropdownlist2.enable(false);

        }

        if ((type == 3) || (type == undefined)) { //solo taglia

            var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeSize_ID']").attr("required", "true");
            dropdownlist.enable(true);

            var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").removeAttr('required');
            dropdownlist1.enable(false);
            //       var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
            //       dropdownlist2.enable(false);

        }

        if ((type == 6) || (type == undefined)) { //taglia/ colore

            var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
            dropdownlist.enable(true);
            $element.find("[name='ProductAttributeSize_ID']").attr("required", "true");
            
            var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
            dropdownlist1.enable(true);
            $element.find("[name='ProductAttributeColor_ID']").attr("required", "true");
            //       var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
            //       dropdownlist2.enable(false);

        }


        if ((type == 8) || (type ==15) || (type == undefined)) { // colore/lotto

            var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeSize_ID']").removeAttr('required');
            dropdownlist.enable(false);
            
            var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").attr("required", "true");
            dropdownlist1.enable(true);
            //       var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
            //       dropdownlist2.enable(true);

        }

        if ((type == 9) || (type == 16) || (type == undefined)) { // taglia/lotto

            var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").attr("required", "true");

            dropdownlist.enable(true);
            var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").removeAttr('required');
            dropdownlist1.enable(false);
            //       var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
            //       dropdownlist2.enable(true);

        }

        if ((type == 12) || (type == 19) || (type == undefined)) { //taglia/ colore/lotto

            var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeSize_ID']").attr("required", "true");
            dropdownlist.enable(true);
            var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").attr("required", "true");
            dropdownlist1.enable(true);
            //       var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
            //       dropdownlist2.enable(true);
        }

        if ((type == 14) || (type == 21) || (type == undefined)) { //senza dimensioni/lotto

            var dropdownlist = $("[name='ProductAttributeSize_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeSize_ID']").removeAttr('required');
            dropdownlist.enable(false);
            var dropdownlist1 = $("[name='ProductAttributeColor_ID']").data("kendoDropDownList");
            $element.find("[name='ProductAttributeColor_ID']").removeAttr('required');
            dropdownlist1.enable(false);
            //       var dropdownlist2 = $("[name='ProductAttributeBatch_ID']").data("kendoDropDownList");
            //       dropdownlist2.enable(true);

        }

        if (init == 1) {
            dropdownlist.value(null);
            dropdownlist1.value(null);
            //       dropdownlist2.value(null);
        }
    }

    function WMSJournalProductChangeLocationFrom(e) {  //manage Dimension Drop - used in Journal Position Field Product_ID:  Dettaglio onchange: WMSJournalProductChange
        var dataInfo = getModelAndContainerFromKendoPopUp(e);
        var model = dataInfo.model;
        if (model == undefined) {
            model = this.gridineditdatasourcemodel;
        }
        var container = dataInfo.container;


        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({
                storedProcedureName: "WMS.GetWMSProductDimension", data: {
                    DocumentBase_ID: model.DocumentBase_ID, Product_ID: model.Product_ID, ProductAttributeAssociation_ID: model.ProductAttributeAssociation_ID,
                    ProductAttributeColor_ID: model.ProductAttributeColor_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID}
            }).then(function (res) {
                var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;

                model["ProductAttributeSize_ID"] = null;
                model["ProductAttributeColor_ID"] = null;
                managdimension(ProductTypeAssociation_ID, container, 0);
                model.dirty = true;
            })
        })

    }

    function WMSJournalProductChange(e) {  //manage Dimension Drop - used in Journal Position Field Product_ID:  Dettaglio onchange: WMSJournalProductChange -
       
        if (e.sender && e.sender.element)
            e = e.sender.element;
        var dataInfo = getModelAndContainerFromKendoPopUp(e);
        var model = dataInfo.model;
        if (model == undefined) {
            model = this.gridineditdatasourcemodel;
        }
        var container = dataInfo.container;
        var inputgrid = grid.attributes.gridname.value.toString();

        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "WMS.GetWMSProductDimension", data: {WMSJournalHeader_ID: model.WMSJournalHeader_ID, DocumentBase_ID: model.DocumentBase_ID, Product_ID: model.Product_ID, InputGrid: inputgrid, ID: model.ID, ProductAttributeAssociation_ID: model.ProductAttributeAssociation_ID } }).then(function (res) {
                var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;

            //    model["ProductAttributeSize_ID"] = null;
                //    model["ProductAttributeColor_ID"] = null;
                var UnitMeasure = res[0][0].UnitMeasure_ID;
                managedefaultProductValue(UnitMeasure, container, 0, model);
                if (ProductTypeAssociation_ID) {
                    managdimension(ProductTypeAssociation_ID, container);
                }
                  //  unitMeasure(e, 1);
               // managdimension(ProductTypeAssociation_ID, container, 0);
                model.dirty = true;
            })
        })

    }

    function WMSJournalProductInit(e) {  //Manage WMSJournal Popup Init - Dimension Drop Enable/Disable

    /*
        if (e.sender && e.sender.element)
            e = e.sender.element;
        var dataInfo = getModelAndContainerFromKendoPopUp(e);
      */  
        CompleteDelivery(e, 1);
        
        var dataInfo = e; // getModelAndContainerFromKendoPopUp(e);
        var model = dataInfo.model;
        if (model == undefined) {
            model = this.gridineditdatasourcemodel;
        }
        var container = dataInfo.container;
        var inputgrid = grid.attributes ? grid.attributes.gridname.value.toString() : e.gridname;
        unitMeasure(e, 1);
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "WMS.GetWMSProductDimension", data: {  DocumentBase_ID: model.DocumentBase_ID, Product_ID: model.Product_ID, InputGrid: inputgrid, ID: model.ID, ProductAttributeAssociation_ID: model.ProductAttributeAssociation_ID } }).then(function (res) {

                if (res.length) {
                    var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;
                    var UnitMeasure = res[0][0].UnitMeasure_ID;
                    if (model.ID == 0) {
                        managedefaultProductValue(UnitMeasure, container, 0, model);
                    }
                    if (ProductTypeAssociation_ID) {
                        managdimension(ProductTypeAssociation_ID, container);
                    }
                    //UnitMeasureChange(e, container);
                   // unitMeasure(e, 1);
                }
            })
        })

    }

    function WMSProductChange(e) {  //manage Dimension Drop - used in Journal Position Field Product_ID:  Dettaglio onchange: WMSJournalProductChange
        var dataInfo = getModelAndContainerFromKendoPopUp(e);
        //var dataInfo = e;
        var model = dataInfo.model;
        if (model == undefined) {
            model = this.gridineditdatasourcemodel;
        }
        var container = dataInfo.container;
        var inputgrid = currentgrid;
        var UntiMeasure_ID = container.find("[name=UnitMeasure_ID]").data("kendoDropDownList").value();
     
        GetPriceAttribute(e);
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "WMS.GetWMSProductDimension", data: { DocumentBase_ID: model.DocumentBase_ID, ProductAttributeColor_ID: model.ProductAttributeColor_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID, DcoumentBase_ID: model.Documentbase_ID, Product_ID: model.Product_ID, InputGrid: inputgrid, ProductAttributeAssociation_ID: model.ProductAttributeAssociation_ID } }).then(function (res) {
                if (res.length)
                {
                var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;
                var UnitMeasure = res[0][0].UnitMeasure_ID;
                if (UnitMeasure == undefined)
                {
                    UnitMeasure = UnitMeasure_ID;
                }
                model["ProductAttributeSize_ID"] = null;
                model["ProductAttributeColor_ID"] = null;
                model["UnitMeasure_ID"] = UnitMeasure; ///FA #5683 Unità di misura di default


                managdimension(ProductTypeAssociation_ID, container, 0);
                managedefaultProductValue(UnitMeasure, container, 0, model);
                //UnitMeasureChange(UnitMeasure, container);
                UnitMeasureChange(e, container);
                }
                model.dirty = true;
            })
        })

    }

    function WMSProductInit(e) {  //Manage WMSJournal Popup Init - Dimension Drop Enable/Disable
        var dataInfo = e; // getModelAndContainerFromKendoPopUp(e);
        var model = dataInfo.model;
        if (model == undefined) {
            model = this.gridineditdatasourcemodel;
        }
        var container = dataInfo.container;
        var inputgrid = currentgrid;


        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "WMS.GetWMSProductDimension", data: {  DocumentBase_ID: model.DocumentBase_ID, Product_ID: model.Product_ID, InputGrid: inputgrid, ProductAttributeAssociation_ID: model.ProductAttributeAssociation_ID } }).then(function (res) {
                if (res.length) {
                    var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;
                    var UnitMeasure = res[0][0].UnitMeasure_ID;

                    managdimension(ProductTypeAssociation_ID, container);
                    if (model.ID == 0) {
                        managedefaultProductValue(UnitMeasure, container, 0, model);
                        
                    }
                    UnitMeasureChange(e, container);
                        // UnitMeasureChange(UnitMeasure, container);
                    
                }
            })
        })

    }


    function WMSProductInit_Product_ID(e) {  //Manage WMSJournal Popup Init - Dimension Drop Enable/Disable
        //  var dataInfo = e; // getModelAndContainerFromKendoPopUp(e);
        //  var model = dataInfo.model;
        //  var container = dataInfo.container;


        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "WMS.GetWMSProductDimension", data: { Product_ID: e} }).then(function (res) {
                var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;

                managdimension(ProductTypeAssociation_ID, container);

            })
        })

    }

    function GetPriceAttribute(e) {
        //deprecated12
        //var data = getCurrentModelInEdit();
        //var dataInfo = getModelAndContainerFromKendoPopUp(e);
        if (e.sender && e.sender.element)
            e = e.sender.element;
        var dataInfo = getModelAndContainerFromKendoPopUp(e);
        var model = dataInfo.model;
        if (model == undefined) {
            model = this.gridineditdatasourcemodel;
        }
        var container = dataInfo.container;
        //var inputgrid = grid.attributes.gridname.value;
        var inputgrid = currentgrid;
        //var gridname = e.sender.element.attr("id");
        //WMSProductChange(e);
        requireConfigAndMore(["MagicSDK"], function (MF) {
            // MF.api.get({ storedProcedureName: "Base.GetPrice", data: { Product_ID: model.Product_ID, Person_ID_Dest: model.Person_ID_Dest, ProductAttributeColor_ID: model.ProductAttributeColor_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID, Quantity: model.Quantity, Discount: model.Discount, Length: model.Length, Width: model.Width} }).then(function (res) {
            //MF.api.get({ storedProcedureName: "Base.GetPrice", data: { Product_ID: model.Product_ID, Person_ID_Dest: model.Person_ID_Dest, ProductAttributeColor_ID: model.ProductAttributeColor_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID, Quantity: model.Quantity, Discount: model.Discount, Length: model.Length, Width: model.Width} }).then(function (res) {
            MF.api.get({ storedProcedureName: "Base.GetPrice", data: { DocumentBase_ID: model.DocumentBase_ID, Product_ID: model.Product_ID, Person_ID_Dest: model.Person_ID_Dest, ProductAttributeColor_ID: model.ProductAttributeColor_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID, Quantity: model.Quantity, Discount: model.Discount, Length: model.Length, Width: model.Width, InputGrid: inputgrid, UnitMeasure_ID: model.UnitMeasure_ID} }).then(function (res) {
                if (res.length) {



                    var UnitAmount = res[0][0].ListPrice / res[0][0].PriceUnit;
                    var PriceUnit = res[0][0].PriceUnit;
                    var DiscountPercent = res[0][0].DiscountPercent;
                    var pricelinear = res[0][0].pricelinear
                    var findsquare = res[0][0].findsquare

                    if (findsquare == 1)
                    {
                        var UnitAmount = res[0][0].pricelinear / res[0][0].PriceUnit;

                    }

                    if (DiscountPercent) {
                        container.find("[name=Discount]").data("kendoNumericTextBox").value(DiscountPercent);
                        var Discount = DiscountPercent;
                        model["Discount"] = Discount;
                    }

                    container.find("[name=PriceUnit]").data("kendoNumericTextBox").value(PriceUnit);
                    model["PriceUnit"] = PriceUnit;

                    if (UnitAmount > 0) {
                        var Quantity = container.find("[name=Quantity]").data("kendoNumericTextBox").value();
                        

                        model["Quantity"] = Quantity;

                        if (!Quantity) {
                            Quantity = 1;
                            container.find("[name=Quantity]").data("kendoNumericTextBox").value(Quantity);
                            model["Quantity"] = Quantity;
                        }

                        if (!Discount) {
                            Discount = 0;
                            container.find("[name=Discount]").data("kendoNumericTextBox").value(Discount);
                            model["Discount"] = Discount;
                        }

                        var NetAmount = (UnitAmount - (UnitAmount * (Discount / 100))) * Quantity;
                        container.find("[name=UnitAmount]").data("kendoNumericTextBox").value(UnitAmount);
                        model["UnitAmount"] = UnitAmount;
                        if (container.find("[name=OriginalPrice]").data("kendoNumericTextBox")) {
                            container.find("[name=OriginalPrice]").data("kendoNumericTextBox").value(UnitAmount);
                            model["OriginalPrice"] = UnitAmount;
                        }

                        try { //if Amount field exists then it updates Amount field. If not, an exeption is raised, catched and TotalAmount is set as the value to be changed
                            container.find("[name=Amount]").data("kendoNumericTextBox").value(NetAmount);
                            model["Amount"] = NetAmount;
                        }
                        catch (e) {
                            container.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
                            model["NetAmount"] = NetAmount;
                        }

                        model.dirty = true;
                    }
                    else
                    {
                        container.find("[name=PriceUnit]").data("kendoNumericTextBox").value(1);
                        model["PriceUnit"] = 1
                        UnitAmount = 0;
                        container.find("[name=UnitAmount]").data("kendoNumericTextBox").value(UnitAmount);
                        model["UnitAmount"] = UnitAmount;
                        container.find("[name=OriginalPrice]").data("kendoNumericTextBox").value(UnitAmount);
                        model["OriginalPrice"] = UnitAmount;
                        container.find("[name=OriginalPrice]").data("kendoNumericTextBox").value(UnitAmount);
                        model["OriginalPrice"] = UnitAmount;

                        
                        try { //if Amount field exists then it updates Amount field. If not, an exeption is raised, catched and TotalAmount is set as the value to be changed
                            container.find("[name=Amount]").data("kendoNumericTextBox").value(0);
                            model["Amount"] = 0;
                        }
                        catch (e) {
                            container.find("[name=NetAmount]").data("kendoNumericTextBox").value(0);
                            model["NetAmount"] = 0;
                        }
                        
                    }
                
                    model.dirty = true;

                }
                else
                {
                    container.find("[name=PriceUnit]").data("kendoNumericTextBox").value(1);
                    model["PriceUnit"] = 1
                    UnitAmount = 0;
                    container.find("[name=UnitAmount]").data("kendoNumericTextBox").value(UnitAmount);
                    model["UnitAmount"] = UnitAmount;
                    container.find("[name=OriginalPrice]").data("kendoNumericTextBox").value(UnitAmount);
                    model["OriginalPrice"] = UnitAmount;
                    model.dirty = true;
                }
            })

        });

        //WMS
        // WMSProductInit_Product_ID(model.Product_ID);
    }

function unitMeasure(e, init) {
    //   UnitMeasureChange(this.value(), this.element.closest('.k-popup-edit-form'));
    if (init == 1) {
        UnitMeasureInit(e, e.container);
    }
    else {
        UnitMeasureChange(e, this.element.closest('.k-popup-edit-form'));
    }
}

function UnitMeasureChange(e, $element) {
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var SquareMeters;
    var LinearMeter;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var jContainer = $element;

    GetPriceAttribute(e);

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Base.GetUnitMeasureDetails", data: { ID: model.UnitMeasure_ID} }).then(function (res) {
            if (res && res.length && res[0].length) {
                SquareMeters = res[0][0].SquareMeters;
                LinearMeter = res[0][0].Linear;
            }
            if (SquareMeters) {
                $element.find("[name='Length'], [name='Width']").closest("[class*=col-]").show();//mostra
                $element.find("[name='Width']").closest("[class*=col-]").show();
                $element.find("[name='Quantity']").attr('readonly', true);//Rende il campo non editabile
                kendo.widgetInstance(jContainer.find("[name=Length]")).bind("spin", UpdateQuantityOnDimensionChangeOnDocumentBasePosition);
                kendo.widgetInstance(jContainer.find("[name=Width]")).bind("spin", UpdateQuantityOnDimensionChangeOnDocumentBasePosition);
            }
            else if (LinearMeter)
            {

                var gridname = currentgrid;
                if (gridname == "DocumentBasePosition_ORA" || gridname == "DocumentBasePosition_FP") {
                    $element.find("[name='Length']").closest("[class*=col-]").hide();
                    $element.find("[name='Width']").closest("[class*=col-]").hide();
                    $element.find("[name='Quantity']").attr('readonly', false);//Rende il campo non editabile
                }
                else
                {
                    $element.find("[name='Length']").closest("[class*=col-]").show();//mostra
                    $element.find("[name='Width']").closest("[class*=col-]").hide(); //nascondi
                    $element.find("[name='Quantity']").attr('readonly', true);//Rende il campo non editabile
                    kendo.widgetInstance(jContainer.find("[name=Length]")).bind("spin", UpdateQuantityOnDimensionChangeOnDocumentBasePosition);
                    
                }
            }
            else {
                $element.find("[name='Length'], [name='Width']").closest("[class*=col-]").hide(); //nascondi

                //Se viene selezionata un unità di misura che non necessita dei campi larghezza e lunghezza per ricavare la quantità ricalcolo l'Importo netto con quantità 1
               // $element.find("[name=Quantity]").data("kendoNumericTextBox").value(1)
                $element.find("[name=Length]").data("kendoNumericTextBox").value(0)
                $element.find("[name=Width]").data("kendoNumericTextBox").value(0)

                var UnitAmount = $element.find("[name=UnitAmount]").data("kendoNumericTextBox").value();
                var Discount = $element.find("[name=Discount]").data("kendoNumericTextBox").value();
                var Quantity = $element.find("[name=Quantity]").data("kendoNumericTextBox").value();
                var NetAmount = (UnitAmount - (UnitAmount * (Discount / 100))) * Quantity; //Calcolo il totale con eventuale sconto
                $element.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
    
                model["NetAmount"]=NetAmount;
                $element.find("[name='Quantity']").attr('readonly', false); //Rende il campo editabile
            }
        })
    });
}


function UnitMeasureInit(e, $element) {
/*
    if (e.sender && e.sender.element)
        e = e.sender.element;
  */
    var SquareMeters;
    var LinearMeter;
    var dataInfo = e;
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var jContainer = $element;

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Base.GetUnitMeasureDetails", data: { ID: model.UnitMeasure_ID} }).then(function (res) {
            if (res && res.length && res[0].length) {
                SquareMeters = res[0][0].SquareMeters;
                LinearMeter = res[0][0].Linear;
            }
            if (SquareMeters) {
                $element.find("[name='Length'], [name='Width']").closest("[class*=col-]").show(); //mostra
                $element.find("[name='Quantity']").attr('readonly', true); //Rende il campo non editabile
                kendo.widgetInstance(jContainer.find("[name=Length]")).bind("spin", UpdateQuantityOnDimensionChangeOnDocumentBasePosition);
                kendo.widgetInstance(jContainer.find("[name=Width]")).bind("spin", UpdateQuantityOnDimensionChangeOnDocumentBasePosition);
            }
            else if (LinearMeter) {

                var gridname = currentgrid;
                if (gridname == "DocumentBasePosition_ORA" || gridname == "DocumentBasePosition_FP") {
                    $element.find("[name='Length']").closest("[class*=col-]").hide();
                    $element.find("[name='Width']").closest("[class*=col-]").hide();
                    $element.find("[name='Quantity']").attr('readonly', false);//Rende il campo non editabile
                }
                else {
                    $element.find("[name='Length']").closest("[class*=col-]").show();//mostra
                    $element.find("[name='Quantity']").attr('readonly', true);//Rende il campo non editabile
                    kendo.widgetInstance(jContainer.find("[name=Length]")).bind("spin", UpdateQuantityOnDimensionChangeOnDocumentBasePosition);

                }

                /*
                // $element.find("[name='Length']").closest("[class*=col-]").show();//mostra
                                
                $element.find("[name='Width']").closest("[class*=col-]").hide();
                $element.find("[name='Quantity']").attr('readonly', false);//Rende il campo non editabile
                */
            }
            else {
                $element.find("[name='Length'], [name='Width']").closest("[class*=col-]").hide(); //nascondi

                //Se viene selezionata un unità di misura che non necessita dei campi larghezza e lunghezza per ricavare la quantità ricalcolo l'Importo netto con quantità 1
               // $element.find("[name=Quantity]").data("kendoNumericTextBox").value(1)
                $element.find("[name=Length]").data("kendoNumericTextBox").value(0)
                $element.find("[name=Width]").data("kendoNumericTextBox").value(0)

                var UnitAmount = $element.find("[name=UnitAmount]").data("kendoNumericTextBox").value();
                var Discount = $element.find("[name=Discount]").data("kendoNumericTextBox").value();
                var Quantity = $element.find("[name=Quantity]").data("kendoNumericTextBox").value();
                var NetAmount = (UnitAmount - (UnitAmount * (Discount / 100))) * Quantity; //Calcolo il totale con eventuale sconto
                $element.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);

                model["NetAmount"] = NetAmount;
                $element.find("[name='Quantity']").attr('readonly', false); //Rende il campo editabile
            }
        })
    });
}

function UpdateQuantityOnDimensionChangeOnDocumentBasePosition(e) {
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    if (model == undefined)
    {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    //var Length = e.value.replace(",", ".") || $(e).val().replace(",", ".");
    //var Length = container.find("[name=Length]").data("kendoNumericTextBox").value();
    var Length = $("[name=Length]").data("kendoNumericTextBox").element[0].value;
    var Width = $("[name=Width]").data("kendoNumericTextBox").element[0].value;
    var Quantity = container.find("[name=Quantity]").data("kendoNumericTextBox").value(Quantity)
    if (Width == undefined) {
        Width = 1;
    }

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "WMS.GetProductQuantity", data: { Product_ID: model.Product_ID, ProductAttributeAssociation_ID: model.ProductAttributeAssociation_ID, DocumentBase_ID: model.DocumentBase_ID, UnitMeasure_ID: model.UnitMeasure_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID, ProductAttributeColor_ID: model.ProductAttributeColor_ID } }).then(function (res) {//Recupero il bit che mi definisce che per quel prodotto bisogna come minimo acquistare una quantità pari a 1 mq
            if (res.length)
            {
                var MinQuantity = res[0][0].MinQty;
                var MultipleQty= res[0][0].MultipleQty;
                var linear = res[0][0].Linear;
                var square = res[0][0].Square;
                    //var Quantity = 0;
                var gridname = currentgrid;
                if (gridname == "DocumentBasePosition_ORA") {
                    Length = Quantity;
                }
                if (MultipleQty == 0) {
                    MultipleQty = 1;
                }
             
           
                if (linear == 1)
                {
                    if (MinQuantity == 0) {
                        MinQuantity = Length;
                    }

                    if (Length < MinQuantity) {
                        Length = MinQuantity;
                    }

                    if (MultipleQty > 0) {
                        var difflinear = (Length / MultipleQty - parseInt(Length / MultipleQty));

                        if (difflinear > 0) {
                            if (difflinear >= 0.5)
                            {
                                Length = parseInt(Length / MultipleQty) + 1;
                            }
                            else
                            {
                                Length = parseInt(Length / MultipleQty);
                            }
                        }
                    }

                    Quantity = Length;

                    container.find("[name=Length]").data("kendoNumericTextBox").value(Length);
                    model["Length"] = Length.replace(",", ".");
                }

                if (square == 1) {
                    var Quantity = Length * Width;

                    if (MinQuantity == 0) {
                        MinQuantity = Quantity;
                    }

                    if (Quantity < MinQuantity) {
                        Quantity = MinQuantity;
                    }

                    if (MultipleQty > 0) {
                        var diffsquare = (Quantity / MultipleQty - parseInt(Quantity / MultipleQty));

                        if (diffsquare > 0) {
                            if (diffsquare >= 0.5)
                            {
                                Quantity = parseInt(Quantity / MultipleQty) + 1;
                            }
                            else
                            {
                                Quantity = parseInt(Quantity / MultipleQty);
                            }
                        }
                    }
                    Length = Quantity / Width;
                    model["Length"] = Length.replace(",", ".");
                    container.find("[name=Length]").data("kendoNumericTextBox").value(Length);
                }
            
            
            }
            else
            {
                if (Length && !Width) //Se c'è solo la lunghezza intanto setto la quantità uguale alla lunghezza
                    Quantity = Length;
                else if (!Length && Width)//Se c'è solo la larghezza intanto setto la quantità uguale alla larghezza
                        Quantity = Width;
                else //Se ho tutti e due i dati faccio la moltiplicazione 
                    Quantity = Length * Width;
            }
            
            var UnitAmount = container.find("[name=UnitAmount]").data("kendoNumericTextBox").value();
            var Discount = container.find("[name=Discount]").data("kendoNumericTextBox").value();
            var NetAmount = (UnitAmount - (UnitAmount * (Discount / 100))) * Quantity; //Calcolo il totale con eventuale sconto

            container.find("[name=Quantity]").data("kendoNumericTextBox").value(Quantity);
            container.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
            model["Quantity"] = Quantity;
            model["NetAmount"] = NetAmount;
            model.dirty = true;
        })
    });

    model.dirty = true;
}
/*
function UpdateQuantityOnLengthChangeOnDocumentBasePosition(e) {
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    var container = dataInfo.container;
    var Length = e.value.replace(",", ".") || $(e).val().replace(",", ".");
    var Width = container.find("[name=Width]").data("kendoNumericTextBox").value();
    if (Width == undefined)
    {
        Width = 1;
    }

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Custom.GetQuantityBitFromProduct", data: { Product_ID: model.Product_ID } }).then(function (res) {//Recupero il bit che mi definisce che per quel prodotto bisogna come minimo acquistare una quantità pari a 1 mq
            var Quantity = Length * Width;//Calcolo i metri qudri

            var MinQuantity = res[0][0];

            if (MinQuantity == "true" && Quantity < 1) //Se il flag è selezionato e la quantità calcolata non arriva a 1 metro quadro setto la quantità a 1, in caso contrario prendo la quantità calcolata indipendentemente dal valore
                Quantity = 1;

            var UnitAmount = container.find("[name=UnitAmount]").data("kendoNumericTextBox").value();
            var Discount = container.find("[name=Discount]").data("kendoNumericTextBox").value();
            var NetAmount = (UnitAmount - (UnitAmount * (Discount / 100))) * Quantity; //Calcolo il totale con eventuale sconto

            container.find("[name=Quantity]").data("kendoNumericTextBox").value(Quantity);
            container.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
            model["Quantity"] = Quantity;
            model["NetAmount"] = NetAmount;
            model.dirty = true;
        })
    });

    model.dirty = true;
}
*/
function UpdateQuantityOnWidthChangeOnDocumentBasePosition(e) {
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    var container = dataInfo.container;
    var Width = e.value.replace(",", ".") || $(e).val().replace(",", ".");
    var Length = container.find("[name=Length]").data("kendoNumericTextBox").value();

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Custom.GetQuantityBitFromProduct", data: { Product_ID: model.Product_ID} }).then(function (res) {//Recupero il bit che mi definisce che per quel prodotto bisogna come minimo acquistare una quantità pari a 1 mq
            var Quantity = Length * Width; //Calcolo i metri qudri

            var MinQuantity = res[0][0];
            if (MinQuantity == "true" && Quantity < 1) //Se il flag è selezionato e la quantità calcolata non arriva a 1 metro quadro setto la quantità a 1, in caso contrario prendo la quantità calcolata indipendentemente dal valore
                Quantity = 1;

            var UnitAmount = container.find("[name=UnitAmount]").data("kendoNumericTextBox").value();
            var Discount = container.find("[name=Discount]").data("kendoNumericTextBox").value();
            var NetAmount = (UnitAmount - (UnitAmount * (Discount / 100))) * Quantity; //Calcolo il totale con eventuale sconto

            container.find("[name=Quantity]").data("kendoNumericTextBox").value(Quantity);
            model["Quantity"] = Quantity;
            container.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
            model["NetAmount"] = NetAmount;

            model.dirty = true;
        })
    });
};

function GetProductDefinition(e) {  //Used for worksheets of the workshop  module 
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    //var dataInfo = e;
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var inputgrid = currentgrid;
    var UntiMeasure_ID = container.find("[name=UnitMeasure_ID]").data("kendoDropDownList").value();

  
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "WMS.GetWMSProductDimension", data: {  Product_ID: model.Product_ID } }).then(function (res) {
            if (res.length) {
                var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;
                var UnitMeasure = res[0][0].UnitMeasure_ID;
                if (UnitMeasure == undefined) {
                    UnitMeasure = UnitMeasure_ID;
                }
               
                model["UnitMeasure_ID"] = UnitMeasure; ///FA #5683 Unità di misura di default
                container.find("[name=UnitMeasure_ID]").data("kendoDropDownList").value(UnitMeasure);
            }
           
            model.dirty = true;
        })
    })

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({
            storedProcedureName: "Machines.GetProductPrice", data: {
                Product_ID: model.Product_ID,
                UnitMeasure_ID: model.UnitMeasure_ID,
                Quantity: model.Quantity,
                ProductAttributeSize_ID: model.ProductAttributeSize_ID,
                ProductAttributeColor_ID: model.ProductAttributeColor_ID,
                RecurringActivity_ID: model.RecurringActivity_ID
            }
        }).then(function (res) {
            var purchasePrice = res[0][0].PurchasePrice;
            var sellPrice = res[0][0].SellPrice;
            var surcharge = res[0][0].Surcharge;

            if (!purchasePrice) {
                purchasePrice = model.ActualListPrice;
                if (model.Surcharge)
                    sellPrice = purchasePrice + (purchasePrice / 100.00 * model.Surcharge);
                else
                    sellPrice = purchasePrice;


            }
            model["ActualListPrice"] = purchasePrice;
            model["FinalSellPrice"] = sellPrice;
            model["Surcharge"] = surcharge;

            container.find("[name=ActualListPrice]").data("kendoNumericTextBox").value(purchasePrice);
            container.find("[name=FinalSellPrice]").data("kendoNumericTextBox").value(sellPrice);
            container.find("[name=Surcharge]").data("kendoNumericTextBox").value(surcharge);
            model.dirty = true;
        })
    })

}

function batchChange(e, $element) {
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    //var dataInfo = e;
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var inputgrid = currentgrid;

    var Batch_ID = container.find("[name=ProductAttributeBatch_ID]").data("kendoDropDownList").value();

    if (Batch_ID) {
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api.get({ storedProcedureName: "Wms.GetBatchDescription", data: { Batch_ID: Batch_ID } }).then(function (res) {
                var BacthDescription = res[0][0].Batch;

                container.find("[name=Batch_Description]").val(BacthDescription);
                model["Batch_Description"] = BacthDescription;

            })
        });
    }
    else {
        container.find("[name=Batch_Description]").val("");
    }
}

function ListPriceProductChange(e) {  //manage Dimension Drop - used in Journal Position Field Product_ID:  Dettaglio onchange: WMSJournalProductChange
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    //var dataInfo = e;
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var inputgrid = currentgrid;
    var UntiMeasure_ID = container.find("[name=UnitMeasure_ID]").data("kendoDropDownList").value();

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "WMS.GetWMSProductDimension", data: { DocumentBase_ID: model.DocumentBase_ID, ProductAttributeColor_ID: model.ProductAttributeColor_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID, DcoumentBase_ID: model.Documentbase_ID, Product_ID: model.Product_ID, InputGrid: inputgrid, ProductAttributeAssociation_ID: model.ProductAttributeAssociation_ID } }).then(function (res) {
            if (res.length) {
                var ProductTypeAssociation_ID = res[0][0].ProductTypeAssociation_ID;
                var UnitMeasure = res[0][0].UnitMeasure_ID;

                model["ProductAttributeSize_ID"] = null;
                model["ProductAttributeColor_ID"] = null;
                model["UnitMeasure_ID"] = UnitMeasure; ///FA #5683 Unità di misura di default
            }
            model.dirty = true;
        })
    })

}

function editListPricePosition(e) {
    //the key is a field that will trigger reload  of the values which binded to dropdowns
    var automationsForDrops = {
        Product_ID: ["ProductAttributeSize_ID", "ProductAttributeColor_ID"],
        Size: ["ProductAttributeColor_ID"]
    };


    var gridname = e.sender.element.attr("id");
    var promise = getStandardEditFunction(e, null, gridname);
    var gridDs = e.sender.dataSource;
    $.when(promise).then(function () {
        gridDs.bind('change', function (ev) {
            $.each(automationsForDrops, function (key, value) {
                if (key == ev.field) {
                    $.each(value, function (i, v) {
                        var $kendodrop = e.container.find("[name=" + v + "]");
                        var kdrop = $kendodrop.data("kendoDropDownList");
                        var dsInfo = e.sender.options.dataSource.schema.model.fields[$kendodrop.attr("name")].dataSourceInfo;
                        getdropdatasource(dsInfo.dataSource, dsInfo.dsTextField, null, $kendodrop.attr("id"), ev.items[0][v], dsInfo.dsValueField, dsInfo.dsSchema, dsInfo.dsTypeId, ev.items[0], false, null, null, false, e.container);
                    });
                }
            });
        });
    });
}