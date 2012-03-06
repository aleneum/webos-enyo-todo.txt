var MakeDirAssistant = function() {
}

MakeDirAssistant.prototype.run = function(future) {
    var fs = IMPORTS.require("fs");
    
    var path = this.controller.args.path;
    
    fs.mkdir(path, 0755, function(err) {
        future.result = { error: err };
    });
}
