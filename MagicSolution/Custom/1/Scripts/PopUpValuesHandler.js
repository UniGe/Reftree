function GetPrice(e) {
    //deprecated12
    // var data = getCurrentModelInEdit();
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    var container = dataInfo.container;
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Base.GetPrice", data: { Product_ID: model.Product_ID, Person_ID_Dest: model.Person_ID_Dest, ProductAttributeColor_ID: model.ProductAttributeColor_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID, Quantity: model.Quantity, Discount: model.Discount, Length: model.Length, Width: model.Width } }).then(function (res) {
            var UnitAmount = res[0][0].ListPrice;
            if (UnitAmount > 0) {
                var Quantity = container.find("[name=Quantity]").data("kendoNumericTextBox").value();
                var Discount = container.find("[name=Discount]").data("kendoNumericTextBox").value();
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

                try { //if Amount field exists then it updates Amount field if not, an exeption is raised, catched and TotalAmount is set as the value to be changed
                    container.find("[name=Amount]").data("kendoNumericTextBox").value(NetAmount);
                    model["Amount"] = NetAmount;
                }
                catch (e) {
                    container.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
                    model["NetAmount"] = NetAmount;
                }
                model.dirty = true;
            }
        })
    });
    //WMS
    WMSProductInit_Product_ID(model.Product_ID);
}

function PriceSurcharge(e) {
   

    requireConfigAndMore(["MagicSDK"], function (MF) {
        //caso evento spin di kendo
        if (e.sender && e.sender.element)
            e = e.sender.element;
            var dataInfo = getModelAndContainerFromKendoPopUp(e);
            var model = dataInfo.model;
        var container = dataInfo.container;
       
        MF.api.get({ storedProcedureName: "Base.GetPriceSurcharge", data: model }).then(function (res) {
           //GetPriceAttribute(e);
            var Percentage = res[0][0]["Percentage"];
            var Quantity = container.find("[name=Quantity]").val().replace(",", ".");
            var OriginalPrice = container.find("[name=OriginalPrice]").val().replace(",", ".");
            var UnitAmount = container.find("[name=UnitAmount]").val().replace(",", ".");
            var Discount = container.find("[name=Discount]").val().replace(",", ".");

            if (OriginalPrice)//Questo campo viene autopopolato con il valore del prezzo unitario preso dalla GetPrice [FA #5246]
            //se esiste il prezzo originale preso dalla GetPrice ad ogni cambiamento della drop applico al prezzo unitario una maggiorazione al prezzo del listino e non quello modificato a mano o adirittutra già maggiorato
            {
                UnitAmount = (OriginalPrice * 1) + (OriginalPrice / 100 * Percentage);
            }
            else {
                UnitAmount = (UnitAmount * 1) + (UnitAmount / 100 * Percentage);
            }

            var NetAmount = 0;

            if (Discount) {
                NetAmount = (UnitAmount - UnitAmount * (Discount / 100)) * Quantity;
            }
            else {
                NetAmount = UnitAmount * Quantity;
            }
            container.find("[name=UnitAmount]").data("kendoNumericTextBox").value(UnitAmount);
            model["UnitAmount"] = UnitAmount;
            try { //if Amount field exists then it updates Amount field if not, an exeption is raised, catched and TotalAmount is set as the value to be changed
                container.find("[name=Amount]").data("kendoNumericTextBox").value(NetAmount);
                model["Amount"] = NetAmount;
            }
            catch (e) {
                container.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
                model["NetAmount"] = NetAmount;
            }

        })
    });

}


function GetPriceAttributeSpin(e)
{
    GetPriceAttribute(e);
}


function UpdatePriceOnFieldChange(e) {
    //caso evento spin di kendo
    if (e.sender && e.sender.element)
        e = e.sender.element;
    //GetPriceAttribute(e);
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    var container = dataInfo.container;    
    var Quantity = container.find("[name=Quantity]").val().replace(",", ".");
    var UnitAmount = container.find("[name=UnitAmount]").val().replace(",", ".");    
    var Discount = container.find("[name=Discount]").val().replace(",", "."); 	
    var NetAmount = 0;
    if (Discount)  {
        NetAmount = (UnitAmount - UnitAmount * (Discount / 100)) * Quantity;
    }
    else {
        NetAmount = UnitAmount * Quantity;
    }
    try { //if Amount field exists then it updates Amount field if not, an exeption is raised, catched and TotalAmount is set as the value to be changed
        container.find("[name=Amount]").data("kendoNumericTextBox").value(NetAmount);
        model["Amount"] = NetAmount;
    }
    catch (e) {
        container.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
        model["NetAmount"] = NetAmount;
    }
  //  model.dirty = true;
}

function UpdatePriceOnUnitAmountChangeOnProjectExpenses(e) {
    //caso evento spin di kendo
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    var container = dataInfo.container;
    var UnitAmount = e.value || $(e).val();
    var Quantity = container.find("[name=Quantity]").data("kendoNumericTextBox").value();
    UnitAmount = UnitAmount.replace(",", ".");
    var NetAmount = 0;
    NetAmount = UnitAmount * Quantity;
    container.find("[name=TotalAmount]").data("kendoNumericTextBox").value(NetAmount);
    model["TotalAmount"] = NetAmount;
    model.dirty = true;
}

function UpdatePriceOnQuantityChangeOnProjectExpenses(e) {
    //caso evento spin di kendo
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    var container = dataInfo.container;
    var Quantity = e.value || $(e).val();
    var UnitAmount = container.find("[name=UnitaryAmount]").data("kendoNumericTextBox").value();
    var NetAmount = 0;
    NetAmount = UnitAmount * Quantity;
    container.find("[name=TotalAmount]").data("kendoNumericTextBox").value(NetAmount);
    model["TotalAmount"] = NetAmount;
    model.dirty = true;
}

function ManageUnitAmountOnProjectExpensesDrop(e) {
    //it is called onChange of the DropDown of the projectExpenses
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var container = dataInfo.container;
    var model = dataInfo.model;
    // manageKMPrice(this.value(), this.element.closest('.k-popup-edit-form'));
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Base.GetExpTypePrice", data: model  }).then(function (res) {
            var Quantity = container.find("[name=Quantity]").data("kendoNumericTextBox").value();
            var UnitaryAmount = res[0][0]["UnitaryAmount"];

            if (UnitaryAmount > 0 || UnitaryAmount != null) {
                var TotalAmount = Quantity * UnitaryAmount
                container.find("[name=UnitaryAmount]").data("kendoNumericTextBox").enable(false);
                container.find("[name=UnitaryAmount]").data("kendoNumericTextBox").value(UnitaryAmount);
                container.find("[name=TotalAmount]").data("kendoNumericTextBox").value(TotalAmount);

                model["UnitaryAmount"] = UnitaryAmount;
                model["TotalAmount"] = TotalAmount;
                
            }
            else {
                container.find("[name=UnitaryAmount]").data("kendoNumericTextBox").enable(true);
            }
                model.dirty = true;
            
        })
    });

    //if (this.value() && this.value() == 7) {
    //    ManageKMPrice(e);
    //    kendo.widgetInstance($(this.element.closest('.k-popup-edit-form')).find("[name*='UnitaryAmount']")).enable(false);


    //} else {
    //    kendo.widgetInstance($(this.element.closest('.k-popup-edit-form')).find("[name*='UnitaryAmount']")).enable(true);
    //}

}

function ManageKMOnProjectExpenses(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");

    if (e.model.ExpenseType_ID && e.model.ExpenseType_ID == 7) {

        kendo.widgetInstance($(e.container).find("[name*='UnitaryAmount']")).enable(false);
    }
}

function ManageKMPrice(e) {
    //deprecated
    // var data = getCurrentModelInEdit();
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var domID = dataInfo.container.context.id;
    var model = dataInfo.model;
    var DocumentBase_ID = model.DocumentBase_ID;
    var container = dataInfo.container;

    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Base.GetKMPrice", data: { domID: domID, DocumentBase_ID: DocumentBase_ID } }).then(function (res) {

            var UnitAmount = res[0][0].KMPrice;

            var Quantity = container.find("[name=Quantity]").data("kendoNumericTextBox").value();
            if (!Quantity) {
                Quantity = 1;
                container.find("[name=Quantity]").data("kendoNumericTextBox").value(Quantity);
                model["Quantity"] = Quantity;
            }

            container.find("[name=UnitaryAmount]").data("kendoNumericTextBox").value(UnitAmount);
            model["UnitaryAmount"] = UnitAmount;

            var TotalAmount = UnitAmount * Quantity;

            container.find("[name=TotalAmount]").data("kendoNumericTextBox").value(TotalAmount);
            model["TotalAmount"] = TotalAmount;


            model.dirty = true;
            if (TotalAmount == 0) {
                //alert
                kendoConsole.log("Inserire costo chilometrico in anagrafica dipendenti", "alert");
            }
        })
    });
}

function hideDocumentBasePositionFields(e) {
    getStandardEditFunction(e, e.sender.options.code, "grid");
    hideDocumentBasePositionFieldsOnEdit(e, e.container);
}

function hideDocumentBasePositionFieldsOnEdit(e, $element) {
    $element.find("[name='Length'], [name='Width']").closest("[class*=col-]").hide(); //nascondi   
}

function GetPrice(e) {
    if (e.sender && e.sender.element)
        e = e.sender.element;
    var dataInfo = getModelAndContainerFromKendoPopUp(e);
    var model = dataInfo.model;
    if (model == undefined) {
        model = this.gridineditdatasourcemodel;
    }
    var container = dataInfo.container;
    var inputgrid = currentgrid;
    requireConfigAndMore(["MagicSDK"], function (MF) {
        MF.api.get({ storedProcedureName: "Base.GetPrice", data: { DocumentBase_ID: model.DocumentBase_ID, Product_ID: model.Product_ID, Person_ID_Dest: model.Person_ID_Dest, ProductAttributeColor_ID: model.ProductAttributeColor_ID, ProductAttributeSize_ID: model.ProductAttributeSize_ID, Quantity: model.Quantity, Discount: model.Discount, Length: model.Length, Width: model.Width, InputGrid: inputgrid, UnitMeasure_ID: model.UnitMeasure_ID } }).then(function (res) {

            var UnitAmount = res[0][0].ListPrice;
            var Discount = res[0][0].DiscountPercent;
            
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
                }

                container.find("[name=Discount]").data("kendoNumericTextBox").value(Discount);
                model["Discount"] = Discount;

                var NetAmount = (UnitAmount - (UnitAmount * (Discount / 100))) * Quantity;
                container.find("[name=UnitAmount]").data("kendoNumericTextBox").value(UnitAmount);
                model["UnitAmount"] = UnitAmount;

                try { //if Amount field exists then it updates Amount field if not, an exeption is raised, catched and TotalAmount is set as the value to be changed
                    container.find("[name=Amount]").data("kendoNumericTextBox").value(NetAmount);
                    model["Amount"] = NetAmount;
                }
                catch (e) {
                    container.find("[name=NetAmount]").data("kendoNumericTextBox").value(NetAmount);
                    model["NetAmount"] = NetAmount;
                }
                model.dirty = true;
            }

        })

    });
}

