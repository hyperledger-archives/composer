
const path = require("path");
const fs = require("fs");
const nunjucks = require("nunjucks");
const util = require("util");
const mkdirp = require("mkdirp");

// convience method
let LOG = console.log;

// main function
function go(args) {

  mkdirp(args.outdir);

  // sort out template and target file
  const targetFile = path.resolve(args.outdir, path.parse(args.input).name + '.md');
  const contextFile = path.resolve(args.input + '.json');
  const templatePath = path.resolve(__dirname, "..", "_template");

  // Note autoescape false - otherwise the --> in the cto file is replaced with --&gt;
  let env = nunjucks.configure(templatePath, { autoescape: false });


  let context = JSON.parse(args.context);
  
  Promise.resolve()
    // parse that
    .then((result) => {

    }).then(() => {
      let str = fs.readFileSync(contextFile);
      Object.assign(context,JSON.parse(str));

      // render the model
      let renderedMarkown = env.render(args.template, context);

      // and write out the file
      fs.writeFileSync(targetFile, renderedMarkown, { encoding: "utf8" });
      console.log("All written to " + targetFile);
    })
    .catch(error => {
      console.log(error);
    });


}




module.exports = go;