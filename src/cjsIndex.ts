import "./common/hack.js";
import NodeARx from "./node/index";
import WebARx from "./web/index";

// this class allows for CJS imports without .default, as well as still allowing for destructured Node/WebARx imports.
class IndexARx extends NodeARx {
  static default = IndexARx;
  static NodeARx = NodeARx;
  static WebARx = WebARx;
}
export = IndexARx;
