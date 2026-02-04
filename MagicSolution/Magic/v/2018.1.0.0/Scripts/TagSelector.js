(function ($) {
    function tagSelector(element, options, k) {
        var self = this;

        self.$input = $(element);
        self.toDo = [];
        self.options = $.extend({
            onChange: null,
            tags: []
        }, options);

        loadCss(['bootstrap-tagsinput']);
        requireConfig(function () {
            require(['bootstrap-tagsinput', 'bootstrap3-typeahead'], function () {
                self.tagsinput = self.$input
                    .tagsinput({
                        freeInput: true,
                        typeahead: {
                            source: function (text) {
                                return $.ajax({ // LIKE %% operator used #mfapireplaced
                                    type: "POST",
                                    url: "/api/DocumentRepository/GetDocumentRepositoryTags",
                                    data: JSON.stringify({ Name: text }),
                                    contentType: "application/json; charset=utf-8",
                                    dataType: "json",
                                    error: function (err) { console.log(err.responseText) }
                                }).then(function (res) {
                                    var records = res.Data[0].Table;
                                    return $.map(records, function (record) { return record.Name });
                                })
                            }
                        }
                    })[0];

                if (self.options.tags) {
                    $.each(self.options.tags, function (k, tag) {
                        self.tagsinput.add(tag);
                    });
                }

                if (self.options.onChange) {
                    self.$input.on('itemAdded', function (event) {
                        self.options.onChange(event);
                    })
                    self.$input.on('itemRemoved', function (event) {
                        self.options.onChange(event);
                    })
                }

                $.each(self.toDo, function (k, v) {
                    v();
                });

                self.$input.trigger('tagSelector:ready');
            });
        });
    }

    tagSelector.prototype = {
        constructor: tagSelector,
        getTags: function () {
            return this.$input.tagsinput ? this.$input.tagsinput('items') : this.options.tags;
        },
        addTags: function (items) {
            var self = this;
            if (!self.tagsinput)
                self.toDo.push(function () { self.addTags(items) });
            else
                $.each(items, function (k, item) {
                    self.$input.tagsinput('add', item);
                });
        },
        removeAll: function () {
            var self = this;
            if (!self.tagsinput)
                self.toDo.push(function () { self.removeAll() });
            else
                this.$input.tagsinput('removeAll');
        },
        save: function () {

        }
    }

    $.fn.tagSelector = function (arg1, arg2) {
        var results = [];
        this.each(function (k, v) {
            var ts = $(this).data('tagSelector');
            if (!ts) {
                ts = new tagSelector(this, arg1, k);
                $(this).data('tagSelector', ts);
                results.push(ts);
            } else if (!arg1 && !arg2) {
                results.push(ts);
            } else if (ts[arg1] !== undefined) {
                var retVal = ts[arg1](arg2);
                if (retVal !== undefined)
                    results.push(retVal);
            }
        });

        if (typeof arg1 == 'string') {
            return results.length > 1 ? results : results[0];
        } else {
            return results;
        }
    }

}(jQuery));