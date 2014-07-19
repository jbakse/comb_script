(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict';


var yaml = require('./lib/js-yaml.js');


module.exports = yaml;

},{"./lib/js-yaml.js":3}],3:[function(require,module,exports){
'use strict';


var loader = require('./js-yaml/loader');
var dumper = require('./js-yaml/dumper');


function deprecated(name) {
  return function () {
    throw new Error('Function ' + name + ' is deprecated and cannot be used.');
  };
}


module.exports.Type                = require('./js-yaml/type');
module.exports.Schema              = require('./js-yaml/schema');
module.exports.FAILSAFE_SCHEMA     = require('./js-yaml/schema/failsafe');
module.exports.JSON_SCHEMA         = require('./js-yaml/schema/json');
module.exports.CORE_SCHEMA         = require('./js-yaml/schema/core');
module.exports.DEFAULT_SAFE_SCHEMA = require('./js-yaml/schema/default_safe');
module.exports.DEFAULT_FULL_SCHEMA = require('./js-yaml/schema/default_full');
module.exports.load                = loader.load;
module.exports.loadAll             = loader.loadAll;
module.exports.safeLoad            = loader.safeLoad;
module.exports.safeLoadAll         = loader.safeLoadAll;
module.exports.dump                = dumper.dump;
module.exports.safeDump            = dumper.safeDump;
module.exports.YAMLException       = require('./js-yaml/exception');

// Deprecared schema names from JS-YAML 2.0.x
module.exports.MINIMAL_SCHEMA = require('./js-yaml/schema/failsafe');
module.exports.SAFE_SCHEMA    = require('./js-yaml/schema/default_safe');
module.exports.DEFAULT_SCHEMA = require('./js-yaml/schema/default_full');

// Deprecated functions from JS-YAML 1.x.x
module.exports.scan           = deprecated('scan');
module.exports.parse          = deprecated('parse');
module.exports.compose        = deprecated('compose');
module.exports.addConstructor = deprecated('addConstructor');

},{"./js-yaml/dumper":5,"./js-yaml/exception":6,"./js-yaml/loader":7,"./js-yaml/schema":9,"./js-yaml/schema/core":10,"./js-yaml/schema/default_full":11,"./js-yaml/schema/default_safe":12,"./js-yaml/schema/failsafe":13,"./js-yaml/schema/json":14,"./js-yaml/type":15}],4:[function(require,module,exports){
'use strict';


function isNothing(subject) {
  return (undefined === subject) || (null === subject);
}


function isObject(subject) {
  return ('object' === typeof subject) && (null !== subject);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) {
    return sequence;
  } else if (isNothing(sequence)) {
    return [];
  } else {
    return [ sequence ];
  }
}


function extend(target, source) {
  var index, length, key, sourceKeys;

  if (source) {
    sourceKeys = Object.keys(source);

    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


module.exports.isNothing  = isNothing;
module.exports.isObject   = isObject;
module.exports.toArray    = toArray;
module.exports.repeat     = repeat;
module.exports.extend     = extend;

},{}],5:[function(require,module,exports){
'use strict';


var common              = require('./common');
var YAMLException       = require('./exception');
var DEFAULT_FULL_SCHEMA = require('./schema/default_full');
var DEFAULT_SAFE_SCHEMA = require('./schema/default_safe');


var _toString       = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;


var CHAR_TAB                  = 0x09; /* Tab */
var CHAR_LINE_FEED            = 0x0A; /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
var CHAR_SPACE                = 0x20; /* Space */
var CHAR_EXCLAMATION          = 0x21; /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
var CHAR_SHARP                = 0x23; /* # */
var CHAR_PERCENT              = 0x25; /* % */
var CHAR_AMPERSAND            = 0x26; /* & */
var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
var CHAR_ASTERISK             = 0x2A; /* * */
var CHAR_COMMA                = 0x2C; /* , */
var CHAR_MINUS                = 0x2D; /* - */
var CHAR_COLON                = 0x3A; /* : */
var CHAR_GREATER_THAN         = 0x3E; /* > */
var CHAR_QUESTION             = 0x3F; /* ? */
var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
var CHAR_VERTICAL_LINE        = 0x7C; /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */


var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';


var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];


function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;

  if (null === map) {
    return {};
  }

  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if ('!!' === tag.slice(0, 2)) {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }

    type = schema.compiledTypeMap[tag];

    if (type && _hasOwnProperty.call(type.dumpStyleAliases, style)) {
      style = type.dumpStyleAliases[style];
    }

    result[tag] = style;
  }

  return result;
}


function encodeHex(character) {
  var string, handle, length;

  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new YAMLException('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}


function State(options) {
  this.schema      = options['schema'] || DEFAULT_FULL_SCHEMA;
  this.indent      = Math.max(1, (options['indent'] || 2));
  this.skipInvalid = options['skipInvalid'] || false;
  this.flowLevel   = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
  this.styleMap    = compileStyleMap(this.schema, options['styles'] || null);

  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;

  this.tag = null;
  this.result = '';
}


function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.loadResolver && type.loadResolver({ result: str })) {
      return true;
    }
  }

  return false;
}

function writeScalar(state, object) {
  var isQuoted, checkpoint, position, length, character, first;

  state.dump = '';
  isQuoted = false;
  checkpoint = 0;
  first = object.charCodeAt(0) || 0;

  if (-1 !== DEPRECATED_BOOLEANS_SYNTAX.indexOf(object)) {
    // Ensure compatibility with YAML 1.0/1.1 loaders.
    isQuoted = true;
  } else if (0 === object.length) {
    // Quote empty string
    isQuoted = true;
  } else if (CHAR_SPACE    === first ||
             CHAR_SPACE    === object.charCodeAt(object.length - 1)) {
    isQuoted = true;
  } else if (CHAR_MINUS    === first ||
             CHAR_QUESTION === first) {
    // Don't check second symbol for simplicity
    isQuoted = true;
  }

  for (position = 0, length = object.length; position < length; position += 1) {
    character = object.charCodeAt(position);

    if (!isQuoted) {
      if (CHAR_TAB                  === character ||
          CHAR_LINE_FEED            === character ||
          CHAR_CARRIAGE_RETURN      === character ||
          CHAR_COMMA                === character ||
          CHAR_LEFT_SQUARE_BRACKET  === character ||
          CHAR_RIGHT_SQUARE_BRACKET === character ||
          CHAR_LEFT_CURLY_BRACKET   === character ||
          CHAR_RIGHT_CURLY_BRACKET  === character ||
          CHAR_SHARP                === character ||
          CHAR_AMPERSAND            === character ||
          CHAR_ASTERISK             === character ||
          CHAR_EXCLAMATION          === character ||
          CHAR_VERTICAL_LINE        === character ||
          CHAR_GREATER_THAN         === character ||
          CHAR_SINGLE_QUOTE         === character ||
          CHAR_DOUBLE_QUOTE         === character ||
          CHAR_PERCENT              === character ||
          CHAR_COMMERCIAL_AT        === character ||
          CHAR_COLON                === character ||
          CHAR_GRAVE_ACCENT         === character) {
        isQuoted = true;
      }
    }

    if (ESCAPE_SEQUENCES[character] ||
        !((0x00020 <= character && character <= 0x00007E) ||
          (0x00085 === character)                         ||
          (0x000A0 <= character && character <= 0x00D7FF) ||
          (0x0E000 <= character && character <= 0x00FFFD) ||
          (0x10000 <= character && character <= 0x10FFFF))) {
      state.dump += object.slice(checkpoint, position);
      state.dump += ESCAPE_SEQUENCES[character] || encodeHex(character);
      checkpoint = position + 1;
      isQuoted = true;
    }
  }

  if (checkpoint < position) {
    state.dump += object.slice(checkpoint, position);
  }

  if (!isQuoted && testImplicitResolving(state, state.dump)) {
    isQuoted = true;
  }

  if (isQuoted) {
    state.dump = '"' + state.dump + '"';
  }
}

function writeFlowSequence(state, level, object) {
  var _result = '',
      _tag    = state.tag,
      index,
      length;

  for (index = 0, length = object.length; index < length; index += 1) {
    // Write only valid elements.
    if (writeNode(state, level, object[index], false, false)) {
      if (0 !== index) {
        _result += ', ';
      }
      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = '[' + _result + ']';
}

function writeBlockSequence(state, level, object, compact) {
  var _result = '',
      _tag    = state.tag,
      index,
      length;

  for (index = 0, length = object.length; index < length; index += 1) {
    // Write only valid elements.
    if (writeNode(state, level + 1, object[index], true, true)) {
      if (!compact || 0 !== index) {
        _result += generateNextLine(state, level);
      }
      _result += '- ' + state.dump;
    }
  }

  state.tag = _tag;
  state.dump = _result || '[]'; // Empty sequence if no valid values.
}

function writeFlowMapping(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (0 !== index) {
      pairBuffer += ', ';
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (!writeNode(state, level, objectKey, false, false)) {
      continue; // Skip this pair because of invalid key;
    }

    if (state.dump.length > 1024) {
      pairBuffer += '? ';
    }

    pairBuffer += state.dump + ': ';

    if (!writeNode(state, level, objectValue, false, false)) {
      continue; // Skip this pair because of invalid value.
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = '{' + _result + '}';
}

function writeBlockMapping(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (!compact || 0 !== index) {
      pairBuffer += generateNextLine(state, level);
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (!writeNode(state, level + 1, objectKey, true, true)) {
      continue; // Skip this pair because of invalid key.
    }

    explicitPair = (null !== state.tag && '?' !== state.tag) ||
                   (state.dump && state.dump.length > 1024);

    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += '?';
      } else {
        pairBuffer += '? ';
      }
    }

    pairBuffer += state.dump;

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }

    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue; // Skip this pair because of invalid value.
    }

    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ':';
    } else {
      pairBuffer += ': ';
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.dumpInstanceOf  || type.dumpPredicate) &&
        (!type.dumpInstanceOf || (('object' === typeof object) && (object instanceof type.dumpInstanceOf))) &&
        (!type.dumpPredicate  || type.dumpPredicate(object))) {

      state.tag = explicit ? type.tag : '?';

      if (type.dumpRepresenter) {
        style = state.styleMap[type.tag] || type.dumpDefaultStyle;

        if ('[object Function]' === _toString.call(type.dumpRepresenter)) {
          _result = type.dumpRepresenter(object, style);
        } else if (_hasOwnProperty.call(type.dumpRepresenter, style)) {
          _result = type.dumpRepresenter[style](object, style);
        } else {
          throw new YAMLException('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
}

// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString.call(state.dump);

  if (block) {
    block = (0 > state.flowLevel || state.flowLevel > level);
  }

  if ((null !== state.tag && '?' !== state.tag) || (2 !== state.indent && level > 0)) {
    compact = false;
  }

  if ('[object Object]' === type) {
    if (block && (0 !== Object.keys(state.dump).length)) {
      writeBlockMapping(state, level, state.dump, compact);
    } else {
      writeFlowMapping(state, level, state.dump);
    }
  } else if ('[object Array]' === type) {
    if (block && (0 !== state.dump.length)) {
      writeBlockSequence(state, level, state.dump, compact);
    } else {
      writeFlowSequence(state, level, state.dump);
    }
  } else if ('[object String]' === type) {
    if ('?' !== state.tag) {
      writeScalar(state, state.dump);
    }
  } else if (state.skipInvalid) {
    return false;
  } else {
    throw new YAMLException('unacceptabe kind of an object to dump ' + type);
  }

  if (null !== state.tag && '?' !== state.tag) {
    state.dump = '!<' + state.tag + '> ' + state.dump;
  }
  return true;
}


function dump(input, options) {
  options = options || {};

  var state = new State(options);

  if (writeNode(state, 0, input, true, true)) {
    return state.dump + '\n';
  } else {
    return '';
  }
}


function safeDump(input, options) {
  return dump(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}


module.exports.dump     = dump;
module.exports.safeDump = safeDump;

},{"./common":4,"./exception":6,"./schema/default_full":11,"./schema/default_safe":12}],6:[function(require,module,exports){
'use strict';


function YAMLException(reason, mark) {
  this.name    = 'YAMLException';
  this.reason  = reason;
  this.mark    = mark;
  this.message = this.toString(false);
}


YAMLException.prototype.toString = function toString(compact) {
  var result;

  result = 'JS-YAML: ' + (this.reason || '(unknown reason)');

  if (!compact && this.mark) {
    result += ' ' + this.mark.toString();
  }

  return result;
};


module.exports = YAMLException;

},{}],7:[function(require,module,exports){
'use strict';


var common              = require('./common');
var YAMLException       = require('./exception');
var Mark                = require('./mark');
var DEFAULT_SAFE_SCHEMA = require('./schema/default_safe');
var DEFAULT_FULL_SCHEMA = require('./schema/default_full');


var _hasOwnProperty = Object.prototype.hasOwnProperty;


var CONTEXT_FLOW_IN   = 1;
var CONTEXT_FLOW_OUT  = 2;
var CONTEXT_BLOCK_IN  = 3;
var CONTEXT_BLOCK_OUT = 4;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var CHAR_TAB                  = 0x09;   /* Tab */
var CHAR_LINE_FEED            = 0x0A;   /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D;   /* CR */
var CHAR_SPACE                = 0x20;   /* Space */
var CHAR_EXCLAMATION          = 0x21;   /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22;   /* " */
var CHAR_SHARP                = 0x23;   /* # */
var CHAR_PERCENT              = 0x25;   /* % */
var CHAR_AMPERSAND            = 0x26;   /* & */
var CHAR_SINGLE_QUOTE         = 0x27;   /* ' */
var CHAR_ASTERISK             = 0x2A;   /* * */
var CHAR_PLUS                 = 0x2B;   /* + */
var CHAR_COMMA                = 0x2C;   /* , */
var CHAR_MINUS                = 0x2D;   /* - */
var CHAR_DOT                  = 0x2E;   /* . */
var CHAR_SLASH                = 0x2F;   /* / */
var CHAR_DIGIT_ZERO           = 0x30;   /* 0 */
var CHAR_DIGIT_ONE            = 0x31;   /* 1 */
var CHAR_DIGIT_NINE           = 0x39;   /* 9 */
var CHAR_COLON                = 0x3A;   /* : */
var CHAR_LESS_THAN            = 0x3C;   /* < */
var CHAR_GREATER_THAN         = 0x3E;   /* > */
var CHAR_QUESTION             = 0x3F;   /* ? */
var CHAR_COMMERCIAL_AT        = 0x40;   /* @ */
var CHAR_CAPITAL_A            = 0x41;   /* A */
var CHAR_CAPITAL_F            = 0x46;   /* F */
var CHAR_CAPITAL_L            = 0x4C;   /* L */
var CHAR_CAPITAL_N            = 0x4E;   /* N */
var CHAR_CAPITAL_P            = 0x50;   /* P */
var CHAR_CAPITAL_U            = 0x55;   /* U */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B;   /* [ */
var CHAR_BACKSLASH            = 0x5C;   /* \ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D;   /* ] */
var CHAR_UNDERSCORE           = 0x5F;   /* _ */
var CHAR_GRAVE_ACCENT         = 0x60;   /* ` */
var CHAR_SMALL_A              = 0x61;   /* a */
var CHAR_SMALL_B              = 0x62;   /* b */
var CHAR_SMALL_E              = 0x65;   /* e */
var CHAR_SMALL_F              = 0x66;   /* f */
var CHAR_SMALL_N              = 0x6E;   /* n */
var CHAR_SMALL_R              = 0x72;   /* r */
var CHAR_SMALL_T              = 0x74;   /* t */
var CHAR_SMALL_U              = 0x75;   /* u */
var CHAR_SMALL_V              = 0x76;   /* v */
var CHAR_SMALL_X              = 0x78;   /* x */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B;   /* { */
var CHAR_VERTICAL_LINE        = 0x7C;   /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D;   /* } */


var SIMPLE_ESCAPE_SEQUENCES = {};

SIMPLE_ESCAPE_SEQUENCES[CHAR_DIGIT_ZERO]   = '\x00';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_A]      = '\x07';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_B]      = '\x08';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_T]      = '\x09';
SIMPLE_ESCAPE_SEQUENCES[CHAR_TAB]          = '\x09';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_N]      = '\x0A';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_V]      = '\x0B';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_F]      = '\x0C';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_R]      = '\x0D';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SMALL_E]      = '\x1B';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SPACE]        = ' ';
SIMPLE_ESCAPE_SEQUENCES[CHAR_DOUBLE_QUOTE] = '\x22';
SIMPLE_ESCAPE_SEQUENCES[CHAR_SLASH]        = '/';
SIMPLE_ESCAPE_SEQUENCES[CHAR_BACKSLASH]    = '\x5C';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_N]    = '\x85';
SIMPLE_ESCAPE_SEQUENCES[CHAR_UNDERSCORE]   = '\xA0';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_L]    = '\u2028';
SIMPLE_ESCAPE_SEQUENCES[CHAR_CAPITAL_P]    = '\u2029';


var HEXADECIMAL_ESCAPE_SEQUENCES = {};

HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_SMALL_X]   = 2;
HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_SMALL_U]   = 4;
HEXADECIMAL_ESCAPE_SEQUENCES[CHAR_CAPITAL_U] = 8;


var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uD800-\uDFFF\uFFFE\uFFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function State(input, options) {
  this.input    = input;

  this.filename = options['filename'] || null;
  this.schema   = options['schema']   || DEFAULT_FULL_SCHEMA;
  this.strict   = options['strict']   || false;
  this.legacy   = options['legacy']   || false;

  this.implicitTypes     = this.schema.compiledImplicit;
  this.typeMap           = this.schema.compiledTypeMap;

  this.length     = input.length;
  this.position   = 0;
  this.line       = 0;
  this.lineStart  = 0;
  this.lineIndent = 0;
  this.character  = input.charCodeAt(0 /*position*/);

  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/

}


function generateError(state, message) {
  return new YAMLException(
    message,
    new Mark(state.filename, state.input, state.position, state.line, (state.position - state.lineStart)));
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  var error = generateError(state, message);

  if (state.strict) {
    throw error;
  } else {
    console.warn(error.toString());
  }
}


var directiveHandlers = {

  'YAML': function handleYamlDirective(state, name, args) {

      var match, major, minor;

      if (null !== state.version) {
        throwError(state, 'duplication of %YAML directive');
      }

      if (1 !== args.length) {
        throwError(state, 'YAML directive accepts exactly one argument');
      }

      match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

      if (null === match) {
        throwError(state, 'ill-formed argument of the YAML directive');
      }

      major = parseInt(match[1], 10);
      minor = parseInt(match[2], 10);

      if (1 !== major) {
        throwError(state, 'unacceptable YAML version of the document');
      }

      state.version = args[0];
      state.checkLineBreaks = (minor < 2);

      if (1 !== minor && 2 !== minor) {
        throwWarning(state, 'unsupported YAML version of the document');
      }
    },

  'TAG': function handleTagDirective(state, name, args) {

      var handle, prefix;

      if (2 !== args.length) {
        throwError(state, 'TAG directive accepts exactly two arguments');
      }

      handle = args[0];
      prefix = args[1];

      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
      }

      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }

      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
      }

      state.tagMap[handle] = prefix;
    }
};


function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
      for (_position = 0, _length = _result.length;
           _position < _length;
           _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(0x09 === _character ||
              0x20 <= _character && _character <= 0x10FFFF)) {
          throwError(state, 'expected valid JSON character');
        }
      }
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source) {
  var sourceKeys, key, index, quantity;

  if (!common.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty.call(destination, key)) {
      destination[key] = source[key];
    }
  }
}

function storeMappingPair(state, _result, keyTag, keyNode, valueNode) {
  var index, quantity;

  keyNode = String(keyNode);

  if (null === _result) {
    _result = {};
  }

  if ('tag:yaml.org,2002:merge' === keyTag) {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index]);
      }
    } else {
      mergeMappings(state, _result, valueNode);
    }
  } else {
    _result[keyNode] = valueNode;
  }

  return _result;
}

function readLineBreak(state) {
  if (CHAR_LINE_FEED === state.character) {
    state.position += 1;
  } else if (CHAR_CARRIAGE_RETURN === state.character) {
    if (CHAR_LINE_FEED === state.input.charCodeAt(state.position + 1)) {
      state.position += 2;
    } else {
      state.position += 1;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
  state.character = state.input.charCodeAt(state.position);
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0;

  while (state.position < state.length) {
    while (CHAR_SPACE === state.character || CHAR_TAB === state.character) {
      state.character = state.input.charCodeAt(++state.position);
    }

    if (allowComments && CHAR_SHARP === state.character) {
      do { state.character = state.input.charCodeAt(++state.position); }
      while (state.position < state.length &&
             CHAR_LINE_FEED !== state.character &&
             CHAR_CARRIAGE_RETURN !== state.character);
    }

    if (CHAR_LINE_FEED === state.character || CHAR_CARRIAGE_RETURN === state.character) {
      readLineBreak(state);
      lineBreaks += 1;
      state.lineIndent = 0;

      while (CHAR_SPACE === state.character) {
        state.lineIndent += 1;
        state.character = state.input.charCodeAt(++state.position);
      }

      if (state.lineIndent < checkIndent) {
        throwWarning(state, 'deficient indentation');
      }
    } else {
      break;
    }
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position, _character;

  if (state.position === state.lineStart &&
      (CHAR_MINUS === state.character || CHAR_DOT === state.character) &&
      state.input.charCodeAt(state.position + 1) === state.character &&
      state.input.charCodeAt(state.position + 2) === state.character) {

    _position = state.position + 3;
    _character = state.input.charCodeAt(_position);

    if (_position >= state.length ||
        CHAR_SPACE           === _character ||
        CHAR_TAB             === _character ||
        CHAR_LINE_FEED       === _character ||
        CHAR_CARRIAGE_RETURN === _character) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (1 === count) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common.repeat('\n', count - 1);
  }
}


function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result;

  if (CHAR_SPACE                === state.character ||
      CHAR_TAB                  === state.character ||
      CHAR_LINE_FEED            === state.character ||
      CHAR_CARRIAGE_RETURN      === state.character ||
      CHAR_COMMA                === state.character ||
      CHAR_LEFT_SQUARE_BRACKET  === state.character ||
      CHAR_RIGHT_SQUARE_BRACKET === state.character ||
      CHAR_LEFT_CURLY_BRACKET   === state.character ||
      CHAR_RIGHT_CURLY_BRACKET  === state.character ||
      CHAR_SHARP                === state.character ||
      CHAR_AMPERSAND            === state.character ||
      CHAR_ASTERISK             === state.character ||
      CHAR_EXCLAMATION          === state.character ||
      CHAR_VERTICAL_LINE        === state.character ||
      CHAR_GREATER_THAN         === state.character ||
      CHAR_SINGLE_QUOTE         === state.character ||
      CHAR_DOUBLE_QUOTE         === state.character ||
      CHAR_PERCENT              === state.character ||
      CHAR_COMMERCIAL_AT        === state.character ||
      CHAR_GRAVE_ACCENT         === state.character) {
    return false;
  }

  if (CHAR_QUESTION === state.character ||
      CHAR_MINUS === state.character) {
    following = state.input.charCodeAt(state.position + 1);

    if (CHAR_SPACE                 === following ||
        CHAR_TAB                   === following ||
        CHAR_LINE_FEED             === following ||
        CHAR_CARRIAGE_RETURN       === following ||
        withinFlowCollection &&
        (CHAR_COMMA                === following ||
         CHAR_LEFT_SQUARE_BRACKET  === following ||
         CHAR_RIGHT_SQUARE_BRACKET === following ||
         CHAR_LEFT_CURLY_BRACKET   === following ||
         CHAR_RIGHT_CURLY_BRACKET  === following)) {
      return false;
    }
  }

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (state.position < state.length) {
    if (CHAR_COLON === state.character) {
      following = state.input.charCodeAt(state.position + 1);

      if (CHAR_SPACE                 === following ||
          CHAR_TAB                   === following ||
          CHAR_LINE_FEED             === following ||
          CHAR_CARRIAGE_RETURN       === following ||
          withinFlowCollection &&
          (CHAR_COMMA                === following ||
           CHAR_LEFT_SQUARE_BRACKET  === following ||
           CHAR_RIGHT_SQUARE_BRACKET === following ||
           CHAR_LEFT_CURLY_BRACKET   === following ||
           CHAR_RIGHT_CURLY_BRACKET  === following)) {
        break;
      }

    } else if (CHAR_SHARP === state.character) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (CHAR_SPACE           === preceding ||
          CHAR_TAB             === preceding ||
          CHAR_LINE_FEED       === preceding ||
          CHAR_CARRIAGE_RETURN === preceding) {
        break;
      }

    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
               withinFlowCollection &&
               (CHAR_COMMA                === state.character ||
                CHAR_LEFT_SQUARE_BRACKET  === state.character ||
                CHAR_RIGHT_SQUARE_BRACKET === state.character ||
                CHAR_LEFT_CURLY_BRACKET   === state.character ||
                CHAR_RIGHT_CURLY_BRACKET  === state.character)) {
      break;

    } else if (CHAR_LINE_FEED === state.character ||
               CHAR_CARRIAGE_RETURN === state.character) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        state.character = state.input.charCodeAt(state.position);
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (CHAR_SPACE !== state.character && CHAR_TAB !== state.character) {
      captureEnd = state.position + 1;
    }

    state.character = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  } else {
    state.kind = _kind;
    state.result = _result;
    return false;
  }
}

function readSingleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd;

  if (CHAR_SINGLE_QUOTE !== state.character) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.character = state.input.charCodeAt(++state.position);
  captureStart = captureEnd = state.position;

  while (state.position < state.length) {
    if (CHAR_SINGLE_QUOTE === state.character) {
      captureSegment(state, captureStart, state.position, true);
      state.character = state.input.charCodeAt(++state.position);

      if (CHAR_SINGLE_QUOTE === state.character) {
        captureStart = captureEnd = state.position;
        state.character = state.input.charCodeAt(++state.position);
      } else {
        return true;
      }

    } else if (CHAR_LINE_FEED === state.character ||
               CHAR_CARRIAGE_RETURN === state.character) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
      state.character = state.input.charCodeAt(state.position);

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');

    } else {
      state.character = state.input.charCodeAt(++state.position);
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart,
      captureEnd,
      hexLength,
      hexIndex,
      hexOffset,
      hexResult;

  if (CHAR_DOUBLE_QUOTE !== state.character) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.character = state.input.charCodeAt(++state.position);
  captureStart = captureEnd = state.position;

  while (state.position < state.length) {
    if (CHAR_DOUBLE_QUOTE === state.character) {
      captureSegment(state, captureStart, state.position, true);
      state.character = state.input.charCodeAt(++state.position);
      return true;

    } else if (CHAR_BACKSLASH === state.character) {
      captureSegment(state, captureStart, state.position, true);
      state.character = state.input.charCodeAt(++state.position);

      if (CHAR_LINE_FEED       === state.character ||
          CHAR_CARRIAGE_RETURN === state.character) {
        skipSeparationSpace(state, false, nodeIndent);

      } else if (SIMPLE_ESCAPE_SEQUENCES[state.character]) {
        state.result += SIMPLE_ESCAPE_SEQUENCES[state.character];
        state.character = state.input.charCodeAt(++state.position);

      } else if (HEXADECIMAL_ESCAPE_SEQUENCES[state.character]) {
        hexLength = HEXADECIMAL_ESCAPE_SEQUENCES[state.character];
        hexResult = 0;

        for (hexIndex = 1; hexIndex <= hexLength; hexIndex += 1) {
          hexOffset = (hexLength - hexIndex) * 4;
          state.character = state.input.charCodeAt(++state.position);

          if (CHAR_DIGIT_ZERO <= state.character && state.character <= CHAR_DIGIT_NINE) {
            hexResult |= (state.character - CHAR_DIGIT_ZERO) << hexOffset;

          } else if (CHAR_CAPITAL_A <= state.character && state.character <= CHAR_CAPITAL_F) {
            hexResult |= (state.character - CHAR_CAPITAL_A + 10) << hexOffset;

          } else if (CHAR_SMALL_A <= state.character && state.character <= CHAR_SMALL_F) {
            hexResult |= (state.character - CHAR_SMALL_A + 10) << hexOffset;

          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += String.fromCharCode(hexResult);
        state.character = state.input.charCodeAt(++state.position);

      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;

    } else if (CHAR_LINE_FEED === state.character ||
               CHAR_CARRIAGE_RETURN === state.character) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
      state.character = state.input.charCodeAt(state.position);

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');

    } else {
      state.character = state.input.charCodeAt(++state.position);
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _tag     = state.tag,
      _result,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      keyNode,
      keyTag,
      valueNode;

  switch (state.character) {
  case CHAR_LEFT_SQUARE_BRACKET:
    terminator = CHAR_RIGHT_SQUARE_BRACKET;
    isMapping = false;
    _result = [];
    break;

  case CHAR_LEFT_CURLY_BRACKET:
    terminator = CHAR_RIGHT_CURLY_BRACKET;
    isMapping = true;
    _result = {};
    break;

  default:
    return false;
  }

  if (null !== state.anchor) {
    state.anchorMap[state.anchor] = _result;
  }

  state.character = state.input.charCodeAt(++state.position);

  while (state.position < state.length) {
    skipSeparationSpace(state, true, nodeIndent);

    if (state.character === terminator) {
      state.character = state.input.charCodeAt(++state.position);
      state.tag = _tag;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (CHAR_QUESTION === state.character) {
      following = state.input.charCodeAt(state.position + 1);

      if (CHAR_SPACE === following ||
          CHAR_TAB === following ||
          CHAR_LINE_FEED === following ||
          CHAR_CARRIAGE_RETURN === following) {
        isPair = isExplicitPair = true;
        state.position += 1;
        state.character = following;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    if ((isExplicitPair || state.line === _line) && CHAR_COLON === state.character) {
      isPair = true;
      state.character = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, keyTag, keyNode, valueNode);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, keyTag, keyNode, valueNode));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    if (CHAR_COMMA === state.character) {
      readNext = true;
      state.character = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      chomping       = CHOMPING_CLIP,
      detectedIndent = false,
      textIndent     = nodeIndent,
      emptyLines     = 0,
      atMoreIndented = false;

  switch (state.character) {
  case CHAR_VERTICAL_LINE:
    folding = false;
    break;

  case CHAR_GREATER_THAN:
    folding = true;
    break;

  default:
    return false;
  }

  state.kind = 'scalar';
  state.result = '';

  while (state.position < state.length) {
    state.character = state.input.charCodeAt(++state.position);

    if (CHAR_PLUS === state.character || CHAR_MINUS === state.character) {
      if (CHOMPING_CLIP === chomping) {
        chomping = (CHAR_PLUS === state.character) ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }

    } else if (CHAR_DIGIT_ZERO <= state.character && state.character <= CHAR_DIGIT_NINE) {
      if (CHAR_DIGIT_ZERO === state.character) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + (state.character - CHAR_DIGIT_ONE);
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }

    } else {
      break;
    }
  }

  if (CHAR_SPACE === state.character || CHAR_TAB === state.character) {
    do { state.character = state.input.charCodeAt(++state.position); }
    while (CHAR_SPACE === state.character || CHAR_TAB === state.character);

    if (CHAR_SHARP === state.character) {
      do { state.character = state.input.charCodeAt(++state.position); }
      while (state.position < state.length &&
             CHAR_LINE_FEED !== state.character &&
             CHAR_CARRIAGE_RETURN !== state.character);
    }
  }

  while (state.position < state.length) {
    readLineBreak(state);
    state.lineIndent = 0;

    while ((!detectedIndent || state.lineIndent < textIndent) &&
           (CHAR_SPACE === state.character)) {
      state.lineIndent += 1;
      state.character = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (CHAR_LINE_FEED === state.character || CHAR_CARRIAGE_RETURN === state.character) {
      emptyLines += 1;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {

      // Perform the chomping.
      switch (chomping) {
      case CHOMPING_KEEP:
        state.result += common.repeat('\n', emptyLines);
        break;

      case CHOMPING_CLIP:
        if (detectedIndent) { // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
        break;
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {

      // Lines starting with white space characters (more-indented lines) are not folded.
      if (CHAR_SPACE === state.character || CHAR_TAB === state.character) {
        atMoreIndented = true;
        state.result += common.repeat('\n', emptyLines + 1);

      // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat('\n', emptyLines + 1);

      // Just one line break - perceive as the same line.
      } else if (0 === emptyLines) {
        if (detectedIndent) { // i.e. only if we have already read some scalar content.
          state.result += ' ';
        }

      // Several line breaks - perceive as different lines.
      } else {
        state.result += common.repeat('\n', emptyLines);
      }

    // Literal style: just add exact number of line breaks between content lines.
    } else {

      // If current line isn't the first one - count line break from the last content line.
      if (detectedIndent) {
        state.result += common.repeat('\n', emptyLines + 1);

      // In case of the first content line - count only empty lines.
      } else {
        state.result += common.repeat('\n', emptyLines);
      }
    }

    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    do { state.character = state.input.charCodeAt(++state.position); }
    while (state.position < state.length &&
           CHAR_LINE_FEED !== state.character &&
           CHAR_CARRIAGE_RETURN !== state.character);

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag      = state.tag,
      _result   = [],
      following,
      detected  = false;

  if (null !== state.anchor) {
    state.anchorMap[state.anchor] = _result;
  }

  while (state.position < state.length) {
    if (CHAR_MINUS !== state.character) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (CHAR_SPACE           !== following &&
        CHAR_TAB             !== following &&
        CHAR_LINE_FEED       !== following &&
        CHAR_CARRIAGE_RETURN !== following) {
      break;
    }

    detected = true;
    state.position += 1;
    state.character = following;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    if ((state.line === _line || state.lineIndent > nodeIndent) && state.position < state.length) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  } else {
    return false;
  }
}

function readBlockMapping(state, nodeIndent) {
  var following,
      allowCompact,
      _line,
      _tag          = state.tag,
      _result       = {},
      keyTag        = null,
      keyNode       = null,
      valueNode     = null,
      atExplicitKey = false,
      detected      = false;

  if (null !== state.anchor) {
    state.anchorMap[state.anchor] = _result;
  }

  while (state.position < state.length) {
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if ((CHAR_QUESTION        === state.character ||
         CHAR_COLON           === state.character) &&
        (CHAR_SPACE           === following ||
         CHAR_TAB             === following ||
         CHAR_LINE_FEED       === following ||
         CHAR_CARRIAGE_RETURN === following)) {

      if (CHAR_QUESTION === state.character) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, keyTag, keyNode, null);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;

      } else if (atExplicitKey) {
        // i.e. CHAR_COLON === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;

      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed');
      }

      state.position += 1;
      state.character = following;

    //
    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
    //
    } else if (composeNode(state, nodeIndent, CONTEXT_FLOW_OUT, false, true)) {
      if (state.line === _line) {
        while (CHAR_SPACE === state.character ||
               CHAR_TAB === state.character) {
          state.character = state.input.charCodeAt(++state.position);
        }

        if (CHAR_COLON === state.character) {
          state.character = state.input.charCodeAt(++state.position);

          if (CHAR_SPACE           !== state.character &&
              CHAR_TAB             !== state.character &&
              CHAR_LINE_FEED       !== state.character &&
              CHAR_CARRIAGE_RETURN !== state.character) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, keyTag, keyNode, null);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;

        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

        } else {
          state.tag = _tag;
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

      } else {
        state.tag = _tag;
        return true; // Keep the result of `composeNode`.
      }

    } else {
      break; // Reading is done. Go to the epilogue.
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, keyTag, keyNode, valueNode);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
    }

    if (state.lineIndent > nodeIndent && state.position < state.length) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, _result, keyTag, keyNode, null);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = _tag;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim = false,
      isNamed    = false,
      tagHandle,
      tagName;

  if (CHAR_EXCLAMATION !== state.character) {
    return false;
  }

  if (null !== state.tag) {
    throwError(state, 'duplication of a tag property');
  }

  state.character = state.input.charCodeAt(++state.position);

  if (CHAR_LESS_THAN === state.character) {
    isVerbatim = true;
    state.character = state.input.charCodeAt(++state.position);

  } else if (CHAR_EXCLAMATION === state.character) {
    isNamed = true;
    tagHandle = '!!';
    state.character = state.input.charCodeAt(++state.position);

  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do { state.character = state.input.charCodeAt(++state.position); }
    while (state.position < state.length && CHAR_GREATER_THAN !== state.character);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      state.character = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (state.position < state.length &&
           CHAR_SPACE           !== state.character &&
           CHAR_TAB             !== state.character &&
           CHAR_LINE_FEED       !== state.character &&
           CHAR_CARRIAGE_RETURN !== state.character) {

      if (CHAR_EXCLAMATION === state.character) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      state.character = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;

  } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;

  } else if ('!' === tagHandle) {
    state.tag = '!' + tagName;

  } else if ('!!' === tagHandle) {
    state.tag = 'tag:yaml.org,2002:' + tagName;

  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position;

  if (CHAR_AMPERSAND !== state.character) {
    return false;
  }

  if (null !== state.anchor) {
    throwError(state, 'duplication of an anchor property');
  }

  state.character = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (state.position < state.length &&
         CHAR_SPACE                !== state.character &&
         CHAR_TAB                  !== state.character &&
         CHAR_LINE_FEED            !== state.character &&
         CHAR_CARRIAGE_RETURN      !== state.character &&
         CHAR_COMMA                !== state.character &&
         CHAR_LEFT_SQUARE_BRACKET  !== state.character &&
         CHAR_RIGHT_SQUARE_BRACKET !== state.character &&
         CHAR_LEFT_CURLY_BRACKET   !== state.character &&
         CHAR_RIGHT_CURLY_BRACKET  !== state.character) {
    state.character = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias;

  if (CHAR_ASTERISK !== state.character) {
    return false;
  }

  state.character = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (state.position < state.length &&
         CHAR_SPACE                !== state.character &&
         CHAR_TAB                  !== state.character &&
         CHAR_LINE_FEED            !== state.character &&
         CHAR_CARRIAGE_RETURN      !== state.character &&
         CHAR_COMMA                !== state.character &&
         CHAR_LEFT_SQUARE_BRACKET  !== state.character &&
         CHAR_RIGHT_SQUARE_BRACKET !== state.character &&
         CHAR_LEFT_CURLY_BRACKET   !== state.character &&
         CHAR_RIGHT_CURLY_BRACKET  !== state.character) {
    state.character = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!state.anchorMap.hasOwnProperty(alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      atNewLine  = false,
      isIndented = true,
      hasContent = false,
      typeIndex,
      typeQuantity,
      type,
      flowIndent,
      blockIndent,
      _result;

  state.tag    = null;
  state.anchor = null;
  state.kind   = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    CONTEXT_BLOCK_OUT === nodeContext ||
    CONTEXT_BLOCK_IN  === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent === parentIndent) {
        isIndented = false;

      } else if (state.lineIndent > parentIndent) {
        isIndented = true;

      } else {
        return false;
      }
    }
  }

  if (isIndented) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;

        if (state.lineIndent > parentIndent) {
          isIndented = true;
          allowBlockCollections = allowBlockStyles;

        } else if (state.lineIndent === parentIndent) {
          isIndented = false;
          allowBlockCollections = allowBlockStyles;

        } else {
          return true;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (isIndented || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (isIndented) {
      if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
           readBlockMapping(state, blockIndent)) ||
          readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;

        } else if (readAlias(state)) {
          hasContent = true;

          if (null !== state.tag || null !== state.anchor) {
            throwError(state, 'alias node should not have any properties');
          }

        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (null === state.tag) {
            state.tag = '?';
          }
        }

        if (null !== state.anchor) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (null !== state.tag && '!' !== state.tag) {
    if ('?' === state.tag) {
      for (typeIndex = 0, typeQuantity = state.implicitTypes.length;
           typeIndex < typeQuantity;
           typeIndex += 1) {
        type = state.implicitTypes[typeIndex];

        // Implicit resolving is not allowed for non-scalar types, and '?'
        // non-specific tag is only assigned to plain scalars. So, it isn't
        // needed to check for 'kind' conformity.

        if (type.loadResolver && type.loadResolver(state)) { // `state.result` updated in resolver if matched
          state.tag = type.tag;
          break;
        }

      }
    } else if (_hasOwnProperty.call(state.typeMap, state.tag)) {
      type = state.typeMap[state.tag];

      if (null !== state.result && type.loadKind !== state.kind) {
        throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.loadKind + '", not "' + state.kind + '"');
      }

      if (type.loadResolver && !type.loadResolver(state)) { // `state.result` updated in resolver if matched
        throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
      }
    } else {
      throwWarning(state, 'unknown tag !<' + state.tag + '>');
    }
  }

  return null !== state.tag || null !== state.anchor || hasContent;
}

function readDocument(state, iterator) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = {};
  state.anchorMap = {};

  while (state.position < state.length) {
    skipSeparationSpace(state, true, -1);

    if (state.lineIndent > 0 || CHAR_PERCENT !== state.character) {
      break;
    }

    hasDirectives = true;
    state.character = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (state.position < state.length &&
           CHAR_SPACE           !== state.character &&
           CHAR_TAB             !== state.character &&
           CHAR_LINE_FEED       !== state.character &&
           CHAR_CARRIAGE_RETURN !== state.character) {
      state.character = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (state.position < state.length) {
      while (CHAR_SPACE === state.character || CHAR_TAB === state.character) {
        state.character = state.input.charCodeAt(++state.position);
      }

      if (CHAR_SHARP === state.character) {
        do { state.character = state.input.charCodeAt(++state.position); }
        while (state.position < state.length &&
               CHAR_LINE_FEED !== state.character &&
               CHAR_CARRIAGE_RETURN !== state.character);
        break;
      }

      if (CHAR_LINE_FEED === state.character || CHAR_CARRIAGE_RETURN === state.character) {
        break;
      }

      _position = state.position;

      while (state.position < state.length &&
             CHAR_SPACE           !== state.character &&
             CHAR_TAB             !== state.character &&
             CHAR_LINE_FEED       !== state.character &&
             CHAR_CARRIAGE_RETURN !== state.character) {
        state.character = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (state.position < state.length) {
      readLineBreak(state);
    }

    if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (0 === state.lineIndent &&
      CHAR_MINUS === state.character &&
      CHAR_MINUS === state.input.charCodeAt(state.position + 1) &&
      CHAR_MINUS === state.input.charCodeAt(state.position + 2)) {
    state.position += 3;
    state.character = state.input.charCodeAt(state.position);
    skipSeparationSpace(state, true, -1);

  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  iterator(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (CHAR_DOT === state.character) {
      state.position += 3;
      state.character = state.input.charCodeAt(state.position);
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < state.length) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}



function loadAll(input, iterator, options) {
  options = options || {};

  var state = new State(input, options);

  if (PATTERN_NON_PRINTABLE.test(state.input)) {
    throwError(state, 'the stream contains non-printable characters');
  }

  while (CHAR_SPACE === state.character) {
    state.lineIndent += 1;
    state.character = state.input.charCodeAt(++state.position);
  }

  while (state.position < state.length) {
    readDocument(state, iterator);
  }
}


function load(input, options) {
  var result = null, received = false;

  function iterator(data) {
    if (!received) {
      result = data;
      received = true;
    } else {
      throw new YAMLException('expected a single document in the stream, but found more');
    }
  }

  loadAll(input, iterator, options);

  return result;
}


function safeLoadAll(input, output, options) {
  loadAll(input, output, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}


function safeLoad(input, options) {
  return load(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}


module.exports.loadAll     = loadAll;
module.exports.load        = load;
module.exports.safeLoadAll = safeLoadAll;
module.exports.safeLoad    = safeLoad;

},{"./common":4,"./exception":6,"./mark":8,"./schema/default_full":11,"./schema/default_safe":12}],8:[function(require,module,exports){
'use strict';


var common = require('./common');


function Mark(name, buffer, position, line, column) {
  this.name     = name;
  this.buffer   = buffer;
  this.position = position;
  this.line     = line;
  this.column   = column;
}


Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
  var head, start, tail, end, snippet;

  if (!this.buffer) {
    return null;
  }

  indent = indent || 4;
  maxLength = maxLength || 75;

  head = '';
  start = this.position;

  while (start > 0 && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(start - 1))) {
    start -= 1;
    if (this.position - start > (maxLength / 2 - 1)) {
      head = ' ... ';
      start += 5;
      break;
    }
  }

  tail = '';
  end = this.position;

  while (end < this.buffer.length && -1 === '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(end))) {
    end += 1;
    if (end - this.position > (maxLength / 2 - 1)) {
      tail = ' ... ';
      end -= 5;
      break;
    }
  }

  snippet = this.buffer.slice(start, end);

  return common.repeat(' ', indent) + head + snippet + tail + '\n' +
         common.repeat(' ', indent + this.position - start + head.length) + '^';
};


Mark.prototype.toString = function toString(compact) {
  var snippet, where = '';

  if (this.name) {
    where += 'in "' + this.name + '" ';
  }

  where += 'at line ' + (this.line + 1) + ', column ' + (this.column + 1);

  if (!compact) {
    snippet = this.getSnippet();

    if (snippet) {
      where += ':\n' + snippet;
    }
  }

  return where;
};


module.exports = Mark;

},{"./common":4}],9:[function(require,module,exports){
'use strict';


var common        = require('./common');
var YAMLException = require('./exception');
var Type          = require('./type');


function compileList(schema, name, result) {
  var exclude = [];

  schema.include.forEach(function (includedSchema) {
    result = compileList(includedSchema, name, result);
  });

  schema[name].forEach(function (currentType) {
    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag) {
        exclude.push(previousIndex);
      }
    });

    result.push(currentType);
  });

  return result.filter(function (type, index) {
    return -1 === exclude.indexOf(index);
  });
}


function compileMap(/* lists... */) {
  var result = {}, index, length;

  function collectType(type) {
    result[type.tag] = type;
  }

  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }

  return result;
}


function Schema(definition) {
  this.include  = definition.include  || [];
  this.implicit = definition.implicit || [];
  this.explicit = definition.explicit || [];

  this.implicit.forEach(function (type) {
    if (type.loadKind && 'scalar' !== type.loadKind) {
      throw new YAMLException('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
    }
  });

  this.compiledImplicit = compileList(this, 'implicit', []);
  this.compiledExplicit = compileList(this, 'explicit', []);
  this.compiledTypeMap  = compileMap(this.compiledImplicit, this.compiledExplicit);
}


Schema.DEFAULT = null;


Schema.create = function createSchema() {
  var schemas, types;

  switch (arguments.length) {
  case 1:
    schemas = Schema.DEFAULT;
    types = arguments[0];
    break;

  case 2:
    schemas = arguments[0];
    types = arguments[1];
    break;

  default:
    throw new YAMLException('Wrong number of arguments for Schema.create function');
  }

  schemas = common.toArray(schemas);
  types = common.toArray(types);

  if (!schemas.every(function (schema) { return schema instanceof Schema; })) {
    throw new YAMLException('Specified list of super schemas (or a single Schema object) contains a non-Schema object.');
  }

  if (!types.every(function (type) { return type instanceof Type; })) {
    throw new YAMLException('Specified list of YAML types (or a single Type object) contains a non-Type object.');
  }

  return new Schema({
    include: schemas,
    explicit: types
  });
};


module.exports = Schema;

},{"./common":4,"./exception":6,"./type":15}],10:[function(require,module,exports){
// Standard YAML's Core schema.
// http://www.yaml.org/spec/1.2/spec.html#id2804923
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, Core schema has no distinctions from JSON schema is JS-YAML.


'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  include: [
    require('./json')
  ]
});

},{"../schema":9,"./json":14}],11:[function(require,module,exports){
// JS-YAML's default schema for `load` function.
// It is not described in the YAML specification.
//
// This schema is based on JS-YAML's default safe schema and includes
// JavaScript-specific types: !!js/undefined, !!js/regexp and !!js/function.
//
// Also this schema is used as default base schema at `Schema.create` function.


'use strict';


var Schema = require('../schema');


module.exports = Schema.DEFAULT = new Schema({
  include: [
    require('./default_safe')
  ],
  explicit: [
    require('../type/js/undefined'),
    require('../type/js/regexp'),
    require('../type/js/function')
  ]
});

},{"../schema":9,"../type/js/function":20,"../type/js/regexp":21,"../type/js/undefined":22,"./default_safe":12}],12:[function(require,module,exports){
// JS-YAML's default schema for `safeLoad` function.
// It is not described in the YAML specification.
//
// This schema is based on standard YAML's Core schema and includes most of
// extra types described at YAML tag repository. (http://yaml.org/type/)


'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  include: [
    require('./core')
  ],
  implicit: [
    require('../type/timestamp'),
    require('../type/merge')
  ],
  explicit: [
    require('../type/binary'),
    require('../type/omap'),
    require('../type/pairs'),
    require('../type/set')
  ]
});

},{"../schema":9,"../type/binary":16,"../type/merge":24,"../type/omap":26,"../type/pairs":27,"../type/set":29,"../type/timestamp":31,"./core":10}],13:[function(require,module,exports){
// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346


'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  explicit: [
    require('../type/str'),
    require('../type/seq'),
    require('../type/map')
  ]
});

},{"../schema":9,"../type/map":23,"../type/seq":28,"../type/str":30}],14:[function(require,module,exports){
// Standard YAML's JSON schema.
// http://www.yaml.org/spec/1.2/spec.html#id2803231
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, this schema is not such strict as defined in the YAML specification.
// It allows numbers in binary notaion, use `Null` and `NULL` as `null`, etc.


'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  include: [
    require('./failsafe')
  ],
  implicit: [
    require('../type/null'),
    require('../type/bool'),
    require('../type/int'),
    require('../type/float')
  ]
});

},{"../schema":9,"../type/bool":17,"../type/float":18,"../type/int":19,"../type/null":25,"./failsafe":13}],15:[function(require,module,exports){
'use strict';


var YAMLException = require('./exception');


var TYPE_CONSTRUCTOR_OPTIONS = [
  'loadKind',
  'loadResolver',
  'dumpInstanceOf',
  'dumpPredicate',
  'dumpRepresenter',
  'dumpDefaultStyle',
  'dumpStyleAliases'
];


var YAML_NODE_KINDS = [
  'scalar',
  'sequence',
  'mapping'
];


function compileStyleAliases(map) {
  var result = {};

  if (null !== map) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}


function Type(tag, options) {
  options = options || {};

  Object.keys(options).forEach(function (name) {
    if (-1 === TYPE_CONSTRUCTOR_OPTIONS.indexOf(name)) {
      throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });

  // TODO: Add tag format check.
  this.tag              = tag;
  this.loadKind         = options['loadKind']         || null;
  this.loadResolver     = options['loadResolver']     || null;
  this.dumpInstanceOf   = options['dumpInstanceOf']   || null;
  this.dumpPredicate    = options['dumpPredicate']    || null;
  this.dumpRepresenter  = options['dumpRepresenter']  || null;
  this.dumpDefaultStyle = options['dumpDefaultStyle'] || null;
  this.dumpStyleAliases = compileStyleAliases(options['dumpStyleAliases'] || null);

  if (-1 === YAML_NODE_KINDS.indexOf(this.loadKind)) {
    throw new YAMLException('Unknown loadKind "' + this.loadKind + '" is specified for "' + tag + '" YAML type.');
  }
}


module.exports = Type;

},{"./exception":6}],16:[function(require,module,exports){
// Modified from:
// https://raw.github.com/kanaka/noVNC/d890e8640f20fba3215ba7be8e0ff145aeb8c17c/include/base64.js

'use strict';

// A trick for browserified version.
// Since we make browserifier to ignore `buffer` module, NodeBuffer will be undefined
var NodeBuffer = require('buffer').Buffer;

var Type       = require('../type');



var BASE64_PADDING = '=';

var BASE64_BINTABLE = [
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
  52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1,  0, -1, -1,
  -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
  -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
];

var BASE64_CHARTABLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');


function resolveYamlBinary(state) {
  var value, code, idx = 0, result = [], leftbits, leftdata,
      object = state.result;

  leftbits = 0; // number of bits decoded, but yet to be appended
  leftdata = 0; // bits decoded, but yet to be appended

  // Convert one by one.
  for (idx = 0; idx < object.length; idx += 1) {
    code = object.charCodeAt(idx);
    value = BASE64_BINTABLE[code & 0x7F];

    // Skip LF(NL) || CR
    if (0x0A !== code && 0x0D !== code) {
      // Fail on illegal characters
      if (-1 === value) {
        return false;
      }

      // Collect data into leftdata, update bitcount
      leftdata = (leftdata << 6) | value;
      leftbits += 6;

      // If we have 8 or more bits, append 8 bits to the result
      if (leftbits >= 8) {
        leftbits -= 8;

        // Append if not padding.
        if (BASE64_PADDING !== object.charAt(idx)) {
          result.push((leftdata >> leftbits) & 0xFF);
        }

        leftdata &= (1 << leftbits) - 1;
      }
    }
  }

  // If there are any bits left, the base64 string was corrupted
  if (leftbits) {
    return false;
  } else {
    // Wrap into Buffer for NodeJS and leave Array for browser
    if (NodeBuffer) {
      state.result = new NodeBuffer(result);
    } else {
      state.result = result;
    }
    return true;
  }
}


function representYamlBinary(object /*, style*/) {
  var result = '', index, length, rest;

  // Convert every three bytes to 4 ASCII characters.
  for (index = 0, length = object.length - 2; index < length; index += 3) {
    result += BASE64_CHARTABLE[object[index + 0] >> 2];
    result += BASE64_CHARTABLE[((object[index + 0] & 0x03) << 4) + (object[index + 1] >> 4)];
    result += BASE64_CHARTABLE[((object[index + 1] & 0x0F) << 2) + (object[index + 2] >> 6)];
    result += BASE64_CHARTABLE[object[index + 2] & 0x3F];
  }

  rest = object.length % 3;

  // Convert the remaining 1 or 2 bytes, padding out to 4 characters.
  if (0 !== rest) {
    index = object.length - rest;
    result += BASE64_CHARTABLE[object[index + 0] >> 2];

    if (2 === rest) {
      result += BASE64_CHARTABLE[((object[index + 0] & 0x03) << 4) + (object[index + 1] >> 4)];
      result += BASE64_CHARTABLE[(object[index + 1] & 0x0F) << 2];
      result += BASE64_PADDING;
    } else {
      result += BASE64_CHARTABLE[(object[index + 0] & 0x03) << 4];
      result += BASE64_PADDING + BASE64_PADDING;
    }
  }

  return result;
}


function isBinary(object) {
  return NodeBuffer && NodeBuffer.isBuffer(object);
}


module.exports = new Type('tag:yaml.org,2002:binary', {
  loadKind: 'scalar',
  loadResolver: resolveYamlBinary,
  dumpPredicate: isBinary,
  dumpRepresenter: representYamlBinary
});

},{"../type":15,"buffer":1}],17:[function(require,module,exports){
'use strict';


var Type = require('../type');


var YAML_IMPLICIT_BOOLEAN_MAP = {
  'true'  : true,
  'True'  : true,
  'TRUE'  : true,
  'false' : false,
  'False' : false,
  'FALSE' : false
};

/*var YAML_EXPLICIT_BOOLEAN_MAP = {
  'true'  : true,
  'True'  : true,
  'TRUE'  : true,
  'false' : false,
  'False' : false,
  'FALSE' : false,
  'y'     : true,
  'Y'     : true,
  'yes'   : true,
  'Yes'   : true,
  'YES'   : true,
  'n'     : false,
  'N'     : false,
  'no'    : false,
  'No'    : false,
  'NO'    : false,
  'on'    : true,
  'On'    : true,
  'ON'    : true,
  'off'   : false,
  'Off'   : false,
  'OFF'   : false
};*/


function resolveYamlBoolean(state) {
  if (YAML_IMPLICIT_BOOLEAN_MAP.hasOwnProperty(state.result)) {
    state.result = YAML_IMPLICIT_BOOLEAN_MAP[state.result];
    return true;
  } else {
    return false;
  }
}


function isBoolean(object) {
  return '[object Boolean]' === Object.prototype.toString.call(object);
}


module.exports = new Type('tag:yaml.org,2002:bool', {
  loadKind: 'scalar',
  loadResolver: resolveYamlBoolean,
  dumpPredicate: isBoolean,
  dumpRepresenter: {
    lowercase: function (object) { return object ? 'true' : 'false'; },
    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
    camelcase: function (object) { return object ? 'True' : 'False'; }
  },
  dumpDefaultStyle: 'lowercase'
});

},{"../type":15}],18:[function(require,module,exports){
'use strict';


var Type = require('../type');


var YAML_FLOAT_PATTERN = new RegExp(
  '^(?:[-+]?(?:[0-9][0-9_]*)\\.[0-9_]*(?:[eE][-+][0-9]+)?' +
  '|\\.[0-9_]+(?:[eE][-+][0-9]+)?' +
  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
  '|[-+]?\\.(?:inf|Inf|INF)' +
  '|\\.(?:nan|NaN|NAN))$');


function resolveYamlFloat(state) {
  var value, sign, base, digits,
      object = state.result;

  if (!YAML_FLOAT_PATTERN.test(object)) {
    return false;
  }

  value  = object.replace(/_/g, '').toLowerCase();
  sign   = '-' === value[0] ? -1 : 1;
  digits = [];

  if (0 <= '+-'.indexOf(value[0])) {
    value = value.slice(1);
  }

  if ('.inf' === value) {
    state.result = (1 === sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    return true;

  } else if ('.nan' === value) {
    state.result = NaN;
    return true;

  } else if (0 <= value.indexOf(':')) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseFloat(v, 10));
    });

    value = 0.0;
    base = 1;

    digits.forEach(function (d) {
      value += d * base;
      base *= 60;
    });

    state.result = sign * value;
    return true;

  } else {
    state.result = sign * parseFloat(value, 10);
    return true;
  }
}


function representYamlFloat(object, style) {
  if (isNaN(object)) {
    switch (style) {
    case 'lowercase':
      return '.nan';
    case 'uppercase':
      return '.NAN';
    case 'camelcase':
      return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
    case 'lowercase':
      return '.inf';
    case 'uppercase':
      return '.INF';
    case 'camelcase':
      return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
    case 'lowercase':
      return '-.inf';
    case 'uppercase':
      return '-.INF';
    case 'camelcase':
      return '-.Inf';
    }
  } else {
    return object.toString(10);
  }
}


function isFloat(object) {
  return ('[object Number]' === Object.prototype.toString.call(object)) &&
         (0 !== object % 1);
}


module.exports = new Type('tag:yaml.org,2002:float', {
  loadKind: 'scalar',
  loadResolver: resolveYamlFloat,
  dumpPredicate: isFloat,
  dumpRepresenter: representYamlFloat,
  dumpDefaultStyle: 'lowercase'
});

},{"../type":15}],19:[function(require,module,exports){
'use strict';


var Type = require('../type');


var YAML_INTEGER_PATTERN = new RegExp(
  '^(?:[-+]?0b[0-1_]+' +
  '|[-+]?0[0-7_]+' +
  '|[-+]?(?:0|[1-9][0-9_]*)' +
  '|[-+]?0x[0-9a-fA-F_]+' +
  '|[-+]?[1-9][0-9_]*(?::[0-5]?[0-9])+)$');


function resolveYamlInteger(state) {
  var value, sign, base, digits,
      object = state.result;

  if (!YAML_INTEGER_PATTERN.test(object)) {
    return false;
  }

  value  = object.replace(/_/g, '');
  sign   = '-' === value[0] ? -1 : 1;
  digits = [];

  if (0 <= '+-'.indexOf(value[0])) {
    value = value.slice(1);
  }

  if ('0' === value) {
    state.result = 0;
    return true;

  } else if (/^0b/.test(value)) {
    state.result = sign * parseInt(value.slice(2), 2);
    return true;

  } else if (/^0x/.test(value)) {
    state.result = sign * parseInt(value, 16);
    return true;

  } else if ('0' === value[0]) {
    state.result = sign * parseInt(value, 8);
    return true;

  } else if (0 <= value.indexOf(':')) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseInt(v, 10));
    });

    value = 0;
    base = 1;

    digits.forEach(function (d) {
      value += (d * base);
      base *= 60;
    });

    state.result = sign * value;
    return true;

  } else {
    state.result = sign * parseInt(value, 10);
    return true;
  }
}


function isInteger(object) {
  return ('[object Number]' === Object.prototype.toString.call(object)) &&
         (0 === object % 1);
}


module.exports = new Type('tag:yaml.org,2002:int', {
  loadKind: 'scalar',
  loadResolver: resolveYamlInteger,
  dumpPredicate: isInteger,
  dumpRepresenter: {
    binary:      function (object) { return '0b' + object.toString(2); },
    octal:       function (object) { return '0'  + object.toString(8); },
    decimal:     function (object) { return        object.toString(10); },
    hexadecimal: function (object) { return '0x' + object.toString(16).toUpperCase(); }
  },
  dumpDefaultStyle: 'decimal',
  dumpStyleAliases: {
    binary:      [ 2,  'bin' ],
    octal:       [ 8,  'oct' ],
    decimal:     [ 10, 'dec' ],
    hexadecimal: [ 16, 'hex' ]
  }
});

},{"../type":15}],20:[function(require,module,exports){
'use strict';


var esprima;

// Browserified version does not have esprima
//
// 1. For node.js just require module as deps
// 2. For browser try to require mudule via external AMD system.
//    If not found - try to fallback to window.esprima. If not
//    found too - then fail to parse.
//
try {
  esprima = require('esprima');
} catch (_) {
  /*global window */
  if (window) { esprima = window.esprima; }
}


var Type = require('../../type');


function resolveJavascriptFunction(state) {
  /*jslint evil:true*/

  try {
    var source = '(' + state.result + ')',
        ast    = esprima.parse(source, { range: true }),
        params = [],
        body;

    if ('Program'             !== ast.type         ||
        1                     !== ast.body.length  ||
        'ExpressionStatement' !== ast.body[0].type ||
        'FunctionExpression'  !== ast.body[0].expression.type) {
      return false;
    }

    ast.body[0].expression.params.forEach(function (param) {
      params.push(param.name);
    });

    body = ast.body[0].expression.body.range;

    // Esprima's ranges include the first '{' and the last '}' characters on
    // function expressions. So cut them out.
    state.result = new Function(params, source.slice(body[0]+1, body[1]-1));
    return true;
  } catch (err) {
    return false;
  }
}


function representJavascriptFunction(object /*, style*/) {
  return object.toString();
}


function isFunction(object) {
  return '[object Function]' === Object.prototype.toString.call(object);
}


module.exports = new Type('tag:yaml.org,2002:js/function', {
  loadKind: 'scalar',
  loadResolver: resolveJavascriptFunction,
  dumpPredicate: isFunction,
  dumpRepresenter: representJavascriptFunction
});

},{"../../type":15,"esprima":32}],21:[function(require,module,exports){
'use strict';


var Type = require('../../type');


function resolveJavascriptRegExp(state) {
  var regexp = state.result,
      tail   = /\/([gim]*)$/.exec(state.result),
      modifiers;

  // `/foo/gim` - tail can be maximum 4 chars
  if ('/' === regexp[0] && tail && 4 >= tail[0].length) {
    regexp = regexp.slice(1, regexp.length - tail[0].length);
    modifiers = tail[1];
  }

  try {
    state.result =  new RegExp(regexp, modifiers);
    return true;
  } catch (error) {
    return false;
  }
}


function representJavascriptRegExp(object /*, style*/) {
  var result = '/' + object.source + '/';

  if (object.global) {
    result += 'g';
  }

  if (object.multiline) {
    result += 'm';
  }

  if (object.ignoreCase) {
    result += 'i';
  }

  return result;
}


function isRegExp(object) {
  return '[object RegExp]' === Object.prototype.toString.call(object);
}


module.exports = new Type('tag:yaml.org,2002:js/regexp', {
  loadKind: 'scalar',
  loadResolver: resolveJavascriptRegExp,
  dumpPredicate: isRegExp,
  dumpRepresenter: representJavascriptRegExp
});

},{"../../type":15}],22:[function(require,module,exports){
'use strict';


var Type = require('../../type');


function resolveJavascriptUndefined(state) {
  state.result = undefined;
  return true;
}


function representJavascriptUndefined(/*object, explicit*/) {
  return '';
}


function isUndefined(object) {
  return 'undefined' === typeof object;
}


module.exports = new Type('tag:yaml.org,2002:js/undefined', {
  loadKind: 'scalar',
  loadResolver: resolveJavascriptUndefined,
  dumpPredicate: isUndefined,
  dumpRepresenter: representJavascriptUndefined
});

},{"../../type":15}],23:[function(require,module,exports){
'use strict';


var Type = require('../type');


module.exports = new Type('tag:yaml.org,2002:map', {
  loadKind: 'mapping'
});

},{"../type":15}],24:[function(require,module,exports){
'use strict';


var Type = require('../type');


function resolveYamlMerge(state) {
  return '<<' === state.result;
}


module.exports = new Type('tag:yaml.org,2002:merge', {
  loadKind: 'scalar',
  loadResolver: resolveYamlMerge
});

},{"../type":15}],25:[function(require,module,exports){
'use strict';


var Type = require('../type');


var YAML_NULL_MAP = {
  '~'    : true,
  'null' : true,
  'Null' : true,
  'NULL' : true
};


function resolveYamlNull(state) {
  if (YAML_NULL_MAP.hasOwnProperty(state.result)) {
    state.result = null;
    return true;
  }
  return false;
}


function isNull(object) {
  return null === object;
}


module.exports = new Type('tag:yaml.org,2002:null', {
  loadKind: 'scalar',
  loadResolver: resolveYamlNull,
  dumpPredicate: isNull,
  dumpRepresenter: {
    canonical: function () { return '~';    },
    lowercase: function () { return 'null'; },
    uppercase: function () { return 'NULL'; },
    camelcase: function () { return 'Null'; }
  },
  dumpDefaultStyle: 'lowercase'
});

},{"../type":15}],26:[function(require,module,exports){
'use strict';


var Type = require('../type');


var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _toString       = Object.prototype.toString;


function resolveYamlOmap(state) {
  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
      object = state.result;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if ('[object Object]' !== _toString.call(pair)) {
      return false;
    }

    for (pairKey in pair) {
      if (_hasOwnProperty.call(pair, pairKey)) {
        if (!pairHasKey) {
          pairHasKey = true;
        } else {
          return false;
        }
      }
    }

    if (!pairHasKey) {
      return false;
    }

    if (-1 === objectKeys.indexOf(pairKey)) {
      objectKeys.push(pairKey);
    } else {
      return false;
    }
  }

  return true;
}


module.exports = new Type('tag:yaml.org,2002:omap', {
  loadKind: 'sequence',
  loadResolver: resolveYamlOmap
});

},{"../type":15}],27:[function(require,module,exports){
'use strict';


var Type = require('../type');


var _toString = Object.prototype.toString;


function resolveYamlPairs(state) {
  var index, length, pair, keys, result,
      object = state.result;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if ('[object Object]' !== _toString.call(pair)) {
      return false;
    }

    keys = Object.keys(pair);

    if (1 !== keys.length) {
      return false;
    }

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  state.result = result;
  return true;
}


module.exports = new Type('tag:yaml.org,2002:pairs', {
  loadKind: 'sequence',
  loadResolver: resolveYamlPairs
});

},{"../type":15}],28:[function(require,module,exports){
'use strict';


var Type = require('../type');


module.exports = new Type('tag:yaml.org,2002:seq', {
  loadKind: 'sequence'
});

},{"../type":15}],29:[function(require,module,exports){
'use strict';


var Type = require('../type');


var _hasOwnProperty = Object.prototype.hasOwnProperty;


function resolveYamlSet(state) {
  var key, object = state.result;

  for (key in object) {
    if (_hasOwnProperty.call(object, key)) {
      if (null !== object[key]) {
        return false;
      }
    }
  }

  return true;
}


module.exports = new Type('tag:yaml.org,2002:set', {
  loadKind: 'mapping',
  loadResolver: resolveYamlSet
});

},{"../type":15}],30:[function(require,module,exports){
'use strict';


var Type = require('../type');


module.exports = new Type('tag:yaml.org,2002:str', {
  loadKind: 'scalar'
});

},{"../type":15}],31:[function(require,module,exports){
'use strict';


var Type = require('../type');


var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9]?)'                   + // [2] month
  '-([0-9][0-9]?)'                   + // [3] day
  '(?:(?:[Tt]|[ \\t]+)'              + // ...
  '([0-9][0-9]?)'                    + // [4] hour
  ':([0-9][0-9])'                    + // [5] minute
  ':([0-9][0-9])'                    + // [6] second
  '(?:\\.([0-9]*))?'                 + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?)?$');         // [11] tz_minute


function resolveYamlTimestamp(state) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, data;

  match = YAML_TIMESTAMP_REGEXP.exec(state.result);

  if (null === match) {
    return false;
  }

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    state.result = new Date(Date.UTC(year, month, day));
    return true;
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if ('-' === match[9]) {
      delta = -delta;
    }
  }

  data = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (delta) {
    data.setTime(data.getTime() - delta);
  }

  state.result = data;
  return true;
}


function representYamlTimestamp(object /*, style*/) {
  return object.toISOString();
}


module.exports = new Type('tag:yaml.org,2002:timestamp', {
  loadKind: 'scalar',
  loadResolver: resolveYamlTimestamp,
  dumpInstanceOf: Date,
  dumpRepresenter: representYamlTimestamp
});

},{"../type":15}],32:[function(require,module,exports){
/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true plusplus:true */
/*global esprima:true, define:true, exports:true, window: true,
throwError: true, createLiteral: true, generateStatement: true,
parseAssignmentExpression: true, parseBlock: true, parseExpression: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseFunctionSourceElements: true, parseVariableIdentifier: true,
parseLeftHandSideExpression: true,
parseStatement: true, parseSourceElement: true */

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        Syntax,
        PropertyKind,
        Messages,
        Regex,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        length,
        buffer,
        state,
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken:  'Unexpected token %0',
        UnexpectedNumber:  'Unexpected number',
        UnexpectedString:  'Unexpected string',
        UnexpectedIdentifier:  'Unexpected identifier',
        UnexpectedReserved:  'Unexpected reserved word',
        UnexpectedEOS:  'Unexpected end of input',
        NewlineAfterThrow:  'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp:  'Invalid regular expression: missing /',
        InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
        InvalidLHSInForIn:  'Invalid left-hand side in for-in',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally:  'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith:  'Strict mode code may not include a with statement',
        StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
        StrictVarName:  'Variable name may not be eval or arguments in strict mode',
        StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
        StrictDelete:  'Delete of an unqualified identifier in strict mode.',
        StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
        AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
        AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
        StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord:  'Use of future reserved word in strict mode'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'),
        NonAsciiIdentifierPart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]')
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function sliceSource(from, to) {
        return source.slice(from, to);
    }

    if (typeof 'esprima'[0] === 'undefined') {
        sliceSource = function sliceArraySource(from, to) {
            return source.slice(from, to).join('');
        };
    }

    function isDecimalDigit(ch) {
        return '0123456789'.indexOf(ch) >= 0;
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }


    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === ' ') || (ch === '\u0009') || (ch === '\u000B') ||
            (ch === '\u000C') || (ch === '\u00A0') ||
            (ch.charCodeAt(0) >= 0x1680 &&
             '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'.indexOf(ch) >= 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029');
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierStart.test(ch));
    }

    function isIdentifierPart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch >= '0') && (ch <= '9')) ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierPart.test(ch));
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {

        // Future reserved words.
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        }

        return false;
    }

    function isStrictModeReservedWord(id) {
        switch (id) {

        // Strict Mode reserved words.
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        }

        return false;
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        var keyword = false;
        switch (id.length) {
        case 2:
            keyword = (id === 'if') || (id === 'in') || (id === 'do');
            break;
        case 3:
            keyword = (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
            break;
        case 4:
            keyword = (id === 'this') || (id === 'else') || (id === 'case') || (id === 'void') || (id === 'with');
            break;
        case 5:
            keyword = (id === 'while') || (id === 'break') || (id === 'catch') || (id === 'throw');
            break;
        case 6:
            keyword = (id === 'return') || (id === 'typeof') || (id === 'delete') || (id === 'switch');
            break;
        case 7:
            keyword = (id === 'default') || (id === 'finally');
            break;
        case 8:
            keyword = (id === 'function') || (id === 'continue') || (id === 'debugger');
            break;
        case 10:
            keyword = (id === 'instanceof');
            break;
        }

        if (keyword) {
            return true;
        }

        switch (id) {
        // Future reserved words.
        // 'const' is specialized as Keyword in V8.
        case 'const':
            return true;

        // For compatiblity to SpiderMonkey and ES.next
        case 'yield':
        case 'let':
            return true;
        }

        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }

        return isFutureReservedWord(id);
    }

    // 7.4 Comments

    function skipComment() {
        var ch, blockComment, lineComment;

        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                ch = source[index++];
                if (isLineTerminator(ch)) {
                    lineComment = false;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                }
            } else if (blockComment) {
                if (isLineTerminator(ch)) {
                    if (ch === '\r' && source[index + 1] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    ch = source[index++];
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    if (ch === '*') {
                        ch = source[index];
                        if (ch === '/') {
                            ++index;
                            blockComment = false;
                        }
                    }
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    index += 2;
                    lineComment = true;
                } else if (ch === '*') {
                    index += 2;
                    blockComment = true;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanIdentifier() {
        var ch, start, id, restore;

        ch = source[index];
        if (!isIdentifierStart(ch)) {
            return;
        }

        start = index;
        if (ch === '\\') {
            ++index;
            if (source[index] !== 'u') {
                return;
            }
            ++index;
            restore = index;
            ch = scanHexEscape('u');
            if (ch) {
                if (ch === '\\' || !isIdentifierStart(ch)) {
                    return;
                }
                id = ch;
            } else {
                index = restore;
                id = 'u';
            }
        } else {
            id = source[index++];
        }

        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch)) {
                break;
            }
            if (ch === '\\') {
                ++index;
                if (source[index] !== 'u') {
                    return;
                }
                ++index;
                restore = index;
                ch = scanHexEscape('u');
                if (ch) {
                    if (ch === '\\' || !isIdentifierPart(ch)) {
                        return;
                    }
                    id += ch;
                } else {
                    index = restore;
                    id += 'u';
                }
            } else {
                id += source[index++];
            }
        }

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            return {
                type: Token.Identifier,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (isKeyword(id)) {
            return {
                type: Token.Keyword,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 7.8.1 Null Literals

        if (id === 'null') {
            return {
                type: Token.NullLiteral,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 7.8.2 Boolean Literals

        if (id === 'true' || id === 'false') {
            return {
                type: Token.BooleanLiteral,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        return {
            type: Token.Identifier,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // 7.7 Punctuators

    function scanPunctuator() {
        var start = index,
            ch1 = source[index],
            ch2,
            ch3,
            ch4;

        // Check for most common single-character punctuators.

        if (ch1 === ';' || ch1 === '{' || ch1 === '}') {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === ',' || ch1 === '(' || ch1 === ')') {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // Dot (.) can also start a floating-point number, hence the need
        // to check the next character.

        ch2 = source[index + 1];
        if (ch1 === '.' && !isDecimalDigit(ch2)) {
            return {
                type: Token.Punctuator,
                value: source[index++],
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // Peek more characters.

        ch3 = source[index + 2];
        ch4 = source[index + 3];

        // 4-character punctuator: >>>=

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            if (ch4 === '=') {
                index += 4;
                return {
                    type: Token.Punctuator,
                    value: '>>>=',
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        // 3-character punctuators: === !== >>> <<= >>=

        if (ch1 === '=' && ch2 === '=' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '===',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '!' && ch2 === '=' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '!==',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>>',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '<' && ch2 === '<' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '<<=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: '>>=',
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }

        // 2-character punctuators: <= >= == != ++ -- << >> && ||
        // += -= *= %= &= |= ^= /=

        if (ch2 === '=') {
            if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
                index += 2;
                return {
                    type: Token.Punctuator,
                    value: ch1 + ch2,
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        if (ch1 === ch2 && ('+-<>&|'.indexOf(ch1) >= 0)) {
            if ('+-<>&|'.indexOf(ch2) >= 0) {
                index += 2;
                return {
                    type: Token.Punctuator,
                    value: ch1 + ch2,
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index]
                };
            }
        }

        // The remaining 1-character punctuators.

        if ('[]<>+-*%&|^!~?:=/'.indexOf(ch1) >= 0) {
            return {
                type: Token.Punctuator,
                value: source[index++],
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index]
            };
        }
    }

    // 7.8.3 Numeric Literals

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    number += source[index++];
                    while (index < length) {
                        ch = source[index];
                        if (!isHexDigit(ch)) {
                            break;
                        }
                        number += source[index++];
                    }

                    if (number.length <= 2) {
                        // only 0x
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }

                    if (index < length) {
                        ch = source[index];
                        if (isIdentifierStart(ch)) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                    return {
                        type: Token.NumericLiteral,
                        value: parseInt(number, 16),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                } else if (isOctalDigit(ch)) {
                    number += source[index++];
                    while (index < length) {
                        ch = source[index];
                        if (!isOctalDigit(ch)) {
                            break;
                        }
                        number += source[index++];
                    }

                    if (index < length) {
                        ch = source[index];
                        if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                        }
                    }
                    return {
                        type: Token.NumericLiteral,
                        value: parseInt(number, 8),
                        octal: true,
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        range: [start, index]
                    };
                }

                // decimal number starts with '0' such as '09' is illegal.
                if (isDecimalDigit(ch)) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            }

            while (index < length) {
                ch = source[index];
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += source[index++];
            }
        }

        if (ch === '.') {
            number += source[index++];
            while (index < length) {
                ch = source[index];
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += source[index++];
            }
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }

            ch = source[index];
            if (isDecimalDigit(ch)) {
                number += source[index++];
                while (index < length) {
                    ch = source[index];
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += source[index++];
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        if (index < length) {
            ch = source[index];
            if (isIdentifierStart(ch)) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    // 7.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch)) {
                    switch (ch) {
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'u':
                    case 'x':
                        restore = index;
                        unescaped = scanHexEscape(ch);
                        if (unescaped) {
                            str += unescaped;
                        } else {
                            index = restore;
                            str += ch;
                        }
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(source[index++]);

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(source[index++]);
                                }
                            }
                            str += String.fromCharCode(code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                }
            } else if (isLineTerminator(ch)) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            range: [start, index]
        };
    }

    function scanRegExp() {
        var str, ch, start, pattern, flags, value, classMarker = false, restore, terminated = false;

        buffer = null;
        skipComment();

        start = index;
        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch)) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                } else if (isLineTerminator(ch)) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        pattern = str.substr(1, str.length - 2);

        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch)) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        str += '\\u';
                        for (; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                } else {
                    str += '\\';
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        try {
            value = new RegExp(pattern, flags);
        } catch (e) {
            throwError({}, Messages.InvalidRegExp);
        }

        return {
            literal: str,
            value: value,
            range: [start, index]
        };
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advance() {
        var ch, token;

        skipComment();

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [index, index]
            };
        }

        token = scanPunctuator();
        if (typeof token !== 'undefined') {
            return token;
        }

        ch = source[index];

        if (ch === '\'' || ch === '"') {
            return scanStringLiteral();
        }

        if (ch === '.' || isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        token = scanIdentifier();
        if (typeof token !== 'undefined') {
            return token;
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    function lex() {
        var token;

        if (buffer) {
            index = buffer.range[1];
            lineNumber = buffer.lineNumber;
            lineStart = buffer.lineStart;
            token = buffer;
            buffer = null;
            return token;
        }

        buffer = null;
        return advance();
    }

    function lookahead() {
        var pos, line, start;

        if (buffer !== null) {
            return buffer;
        }

        pos = index;
        line = lineNumber;
        start = lineStart;
        buffer = advance();
        index = pos;
        lineNumber = line;
        lineStart = start;

        return buffer;
    }

    // Return true if there is a line terminator before the next token.

    function peekLineTerminator() {
        var pos, line, start, found;

        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;

        return found;
    }

    // Throw an exception

    function throwError(token, messageFormat) {
        var error,
            args = Array.prototype.slice.call(arguments, 2),
            msg = messageFormat.replace(
                /%(\d)/g,
                function (whole, index) {
                    return args[index] || '';
                }
            );

        if (typeof token.lineNumber === 'number') {
            error = new Error('Line ' + token.lineNumber + ': ' + msg);
            error.index = token.range[0];
            error.lineNumber = token.lineNumber;
            error.column = token.range[0] - lineStart + 1;
        } else {
            error = new Error('Line ' + lineNumber + ': ' + msg);
            error.index = index;
            error.lineNumber = lineNumber;
            error.column = index - lineStart + 1;
        }

        throw error;
    }

    function throwErrorTolerant() {
        try {
            throwError.apply(null, arguments);
        } catch (e) {
            if (extra.errors) {
                extra.errors.push(e);
            } else {
                throw e;
            }
        }
    }


    // Throw an exception because of the token.

    function throwUnexpected(token) {
        if (token.type === Token.EOF) {
            throwError(token, Messages.UnexpectedEOS);
        }

        if (token.type === Token.NumericLiteral) {
            throwError(token, Messages.UnexpectedNumber);
        }

        if (token.type === Token.StringLiteral) {
            throwError(token, Messages.UnexpectedString);
        }

        if (token.type === Token.Identifier) {
            throwError(token, Messages.UnexpectedIdentifier);
        }

        if (token.type === Token.Keyword) {
            if (isFutureReservedWord(token.value)) {
                throwError(token, Messages.UnexpectedReserved);
            } else if (strict && isStrictModeReservedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictReservedWord);
                return;
            }
            throwError(token, Messages.UnexpectedToken, token.value);
        }

        // BooleanLiteral, NullLiteral, or Punctuator.
        throwError(token, Messages.UnexpectedToken, token.value);
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpected(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        var token = lookahead();
        return token.type === Token.Punctuator && token.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        var token = lookahead();
        return token.type === Token.Keyword && token.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var token = lookahead(),
            op = token.value;

        if (token.type !== Token.Punctuator) {
            return false;
        }
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        var token, line;

        // Catch the very common case first.
        if (source[index] === ';') {
            lex();
            return;
        }

        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            return;
        }

        if (match(';')) {
            lex();
            return;
        }

        token = lookahead();
        if (token.type !== Token.EOF && !match('}')) {
            throwUnexpected(token);
        }
    }

    // Return true if provided expression is LeftHandSideExpression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [];

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                elements.push(parseAssignmentExpression());

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        expect(']');

        return {
            type: Syntax.ArrayExpression,
            elements: elements
        };
    }

    // 11.1.5 Object Initialiser

    function parsePropertyFunction(param, first) {
        var previousStrict, body;

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (first && strict && isRestrictedWord(param[0].name)) {
            throwErrorTolerant(first, Messages.StrictParamName);
        }
        strict = previousStrict;

        return {
            type: Syntax.FunctionExpression,
            id: null,
            params: param,
            defaults: [],
            body: body,
            rest: null,
            generator: false,
            expression: false
        };
    }

    function parseObjectPropertyKey() {
        var token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return createLiteral(token);
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }

    function parseObjectProperty() {
        var token, key, id, param;

        token = lookahead();

        if (token.type === Token.Identifier) {

            id = parseObjectPropertyKey();

            // Property Assignment: Getter and Setter.

            if (token.value === 'get' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                expect(')');
                return {
                    type: Syntax.Property,
                    key: key,
                    value: parsePropertyFunction([]),
                    kind: 'get'
                };
            } else if (token.value === 'set' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                token = lookahead();
                if (token.type !== Token.Identifier) {
                    expect(')');
                    throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
                    return {
                        type: Syntax.Property,
                        key: key,
                        value: parsePropertyFunction([]),
                        kind: 'set'
                    };
                } else {
                    param = [ parseVariableIdentifier() ];
                    expect(')');
                    return {
                        type: Syntax.Property,
                        key: key,
                        value: parsePropertyFunction(param, token),
                        kind: 'set'
                    };
                }
            } else {
                expect(':');
                return {
                    type: Syntax.Property,
                    key: id,
                    value: parseAssignmentExpression(),
                    kind: 'init'
                };
            }
        } else if (token.type === Token.EOF || token.type === Token.Punctuator) {
            throwUnexpected(token);
        } else {
            key = parseObjectPropertyKey();
            expect(':');
            return {
                type: Syntax.Property,
                key: key,
                value: parseAssignmentExpression(),
                kind: 'init'
            };
        }
    }

    function parseObjectInitialiser() {
        var properties = [], property, name, kind, map = {}, toString = String;

        expect('{');

        while (!match('}')) {
            property = parseObjectProperty();

            if (property.key.type === Syntax.Identifier) {
                name = property.key.name;
            } else {
                name = toString(property.key.value);
            }
            kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;
            if (Object.prototype.hasOwnProperty.call(map, name)) {
                if (map[name] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                } else {
                    if (kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (map[name] & kind) {
                        throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                }
                map[name] |= kind;
            } else {
                map[name] = kind;
            }

            properties.push(property);

            if (!match('}')) {
                expect(',');
            }
        }

        expect('}');

        return {
            type: Syntax.ObjectExpression,
            properties: properties
        };
    }

    // 11.1.6 The Grouping Operator

    function parseGroupExpression() {
        var expr;

        expect('(');

        expr = parseExpression();

        expect(')');

        return expr;
    }


    // 11.1 Primary Expressions

    function parsePrimaryExpression() {
        var token = lookahead(),
            type = token.type;

        if (type === Token.Identifier) {
            return {
                type: Syntax.Identifier,
                name: lex().value
            };
        }

        if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return createLiteral(lex());
        }

        if (type === Token.Keyword) {
            if (matchKeyword('this')) {
                lex();
                return {
                    type: Syntax.ThisExpression
                };
            }

            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
        }

        if (type === Token.BooleanLiteral) {
            lex();
            token.value = (token.value === 'true');
            return createLiteral(token);
        }

        if (type === Token.NullLiteral) {
            lex();
            token.value = null;
            return createLiteral(token);
        }

        if (match('[')) {
            return parseArrayInitialiser();
        }

        if (match('{')) {
            return parseObjectInitialiser();
        }

        if (match('(')) {
            return parseGroupExpression();
        }

        if (match('/') || match('/=')) {
            return createLiteral(scanRegExp());
        }

        return throwUnexpected(lex());
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [];

        expect('(');

        if (!match(')')) {
            while (index < length) {
                args.push(parseAssignmentExpression());
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpected(token);
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = parseExpression();

        expect(']');

        return expr;
    }

    function parseNewExpression() {
        var expr;

        expectKeyword('new');

        expr = {
            type: Syntax.NewExpression,
            callee: parseLeftHandSideExpression(),
            'arguments': []
        };

        if (match('(')) {
            expr['arguments'] = parseArguments();
        }

        return expr;
    }

    function parseLeftHandSideExpressionAllowCall() {
        var expr;

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || match('(')) {
            if (match('(')) {
                expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    'arguments': parseArguments()
                };
            } else if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
            } else {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
            }
        }

        return expr;
    }


    function parseLeftHandSideExpression() {
        var expr;

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[')) {
            if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
            } else {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
            }
        }

        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var expr = parseLeftHandSideExpressionAllowCall(), token;

        token = lookahead();
        if (token.type !== Token.Punctuator) {
            return expr;
        }

        if ((match('++') || match('--')) && !peekLineTerminator()) {
            // 11.3.1, 11.3.2
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPostfix);
            }
            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            expr = {
                type: Syntax.UpdateExpression,
                operator: lex().value,
                argument: expr,
                prefix: false
            };
        }

        return expr;
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var token, expr;

        token = lookahead();
        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return parsePostfixExpression();
        }

        if (match('++') || match('--')) {
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPrefix);
            }

            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            expr = {
                type: Syntax.UpdateExpression,
                operator: token.value,
                argument: expr,
                prefix: true
            };
            return expr;
        }

        if (match('+') || match('-') || match('~') || match('!')) {
            expr = {
                type: Syntax.UnaryExpression,
                operator: lex().value,
                argument: parseUnaryExpression(),
                prefix: true
            };
            return expr;
        }

        if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            expr = {
                type: Syntax.UnaryExpression,
                operator: lex().value,
                argument: parseUnaryExpression(),
                prefix: true
            };
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                throwErrorTolerant({}, Messages.StrictDelete);
            }
            return expr;
        }

        return parsePostfixExpression();
    }

    // 11.5 Multiplicative Operators

    function parseMultiplicativeExpression() {
        var expr = parseUnaryExpression();

        while (match('*') || match('/') || match('%')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseUnaryExpression()
            };
        }

        return expr;
    }

    // 11.6 Additive Operators

    function parseAdditiveExpression() {
        var expr = parseMultiplicativeExpression();

        while (match('+') || match('-')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseMultiplicativeExpression()
            };
        }

        return expr;
    }

    // 11.7 Bitwise Shift Operators

    function parseShiftExpression() {
        var expr = parseAdditiveExpression();

        while (match('<<') || match('>>') || match('>>>')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseAdditiveExpression()
            };
        }

        return expr;
    }
    // 11.8 Relational Operators

    function parseRelationalExpression() {
        var expr, previousAllowIn;

        previousAllowIn = state.allowIn;
        state.allowIn = true;

        expr = parseShiftExpression();

        while (match('<') || match('>') || match('<=') || match('>=') || (previousAllowIn && matchKeyword('in')) || matchKeyword('instanceof')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseShiftExpression()
            };
        }

        state.allowIn = previousAllowIn;
        return expr;
    }

    // 11.9 Equality Operators

    function parseEqualityExpression() {
        var expr = parseRelationalExpression();

        while (match('==') || match('!=') || match('===') || match('!==')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseRelationalExpression()
            };
        }

        return expr;
    }

    // 11.10 Binary Bitwise Operators

    function parseBitwiseANDExpression() {
        var expr = parseEqualityExpression();

        while (match('&')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '&',
                left: expr,
                right: parseEqualityExpression()
            };
        }

        return expr;
    }

    function parseBitwiseXORExpression() {
        var expr = parseBitwiseANDExpression();

        while (match('^')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '^',
                left: expr,
                right: parseBitwiseANDExpression()
            };
        }

        return expr;
    }

    function parseBitwiseORExpression() {
        var expr = parseBitwiseXORExpression();

        while (match('|')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '|',
                left: expr,
                right: parseBitwiseXORExpression()
            };
        }

        return expr;
    }

    // 11.11 Binary Logical Operators

    function parseLogicalANDExpression() {
        var expr = parseBitwiseORExpression();

        while (match('&&')) {
            lex();
            expr = {
                type: Syntax.LogicalExpression,
                operator: '&&',
                left: expr,
                right: parseBitwiseORExpression()
            };
        }

        return expr;
    }

    function parseLogicalORExpression() {
        var expr = parseLogicalANDExpression();

        while (match('||')) {
            lex();
            expr = {
                type: Syntax.LogicalExpression,
                operator: '||',
                left: expr,
                right: parseLogicalANDExpression()
            };
        }

        return expr;
    }

    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent;

        expr = parseLogicalORExpression();

        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');

            expr = {
                type: Syntax.ConditionalExpression,
                test: expr,
                consequent: consequent,
                alternate: parseAssignmentExpression()
            };
        }

        return expr;
    }

    // 11.13 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr;

        token = lookahead();
        expr = parseConditionalExpression();

        if (matchAssign()) {
            // LeftHandSideExpression
            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            // 11.13.1
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant(token, Messages.StrictLHSAssignment);
            }

            expr = {
                type: Syntax.AssignmentExpression,
                operator: lex().value,
                left: expr,
                right: parseAssignmentExpression()
            };
        }

        return expr;
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var expr = parseAssignmentExpression();

        if (match(',')) {
            expr = {
                type: Syntax.SequenceExpression,
                expressions: [ expr ]
            };

            while (index < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expr.expressions.push(parseAssignmentExpression());
            }

        }
        return expr;
    }

    // 12.1 Block

    function parseStatementList() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseBlock() {
        var block;

        expect('{');

        block = parseStatementList();

        expect('}');

        return {
            type: Syntax.BlockStatement,
            body: block
        };
    }

    // 12.2 Variable Statement

    function parseVariableIdentifier() {
        var token = lex();

        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }

        return {
            type: Syntax.Identifier,
            name: token.value
        };
    }

    function parseVariableDeclaration(kind) {
        var id = parseVariableIdentifier(),
            init = null;

        // 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            throwErrorTolerant({}, Messages.StrictVarName);
        }

        if (kind === 'const') {
            expect('=');
            init = parseAssignmentExpression();
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return {
            type: Syntax.VariableDeclarator,
            id: id,
            init: init
        };
    }

    function parseVariableDeclarationList(kind) {
        var list = [];

        do {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        } while (index < length);

        return list;
    }

    function parseVariableStatement() {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return {
            type: Syntax.VariableDeclaration,
            declarations: declarations,
            kind: 'var'
        };
    }

    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations;

        expectKeyword(kind);

        declarations = parseVariableDeclarationList(kind);

        consumeSemicolon();

        return {
            type: Syntax.VariableDeclaration,
            declarations: declarations,
            kind: kind
        };
    }

    // 12.3 Empty Statement

    function parseEmptyStatement() {
        expect(';');

        return {
            type: Syntax.EmptyStatement
        };
    }

    // 12.4 Expression Statement

    function parseExpressionStatement() {
        var expr = parseExpression();

        consumeSemicolon();

        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }

    // 12.5 If statement

    function parseIfStatement() {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return {
            type: Syntax.IfStatement,
            test: test,
            consequent: consequent,
            alternate: alternate
        };
    }

    // 12.6 Iteration Statements

    function parseDoWhileStatement() {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return {
            type: Syntax.DoWhileStatement,
            body: body,
            test: test
        };
    }

    function parseWhileStatement() {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return {
            type: Syntax.WhileStatement,
            test: test,
            body: body
        };
    }

    function parseForVariableDeclaration() {
        var token = lex();

        return {
            type: Syntax.VariableDeclaration,
            declarations: parseVariableDeclarationList(),
            kind: token.value
        };
    }

    function parseForStatement() {
        var init, test, update, left, right, body, oldInIteration;

        init = test = update = null;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var') || matchKeyword('let')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = true;

                if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = true;

                if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isLeftHandSide(init)) {
                        throwErrorTolerant({}, Messages.InvalidLHSInForIn);
                    }

                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }

            if (typeof left === 'undefined') {
                expect(';');
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        if (typeof left === 'undefined') {
            return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
            };
        }

        return {
            type: Syntax.ForInStatement,
            left: left,
            right: right,
            body: body,
            each: false
        };
    }

    // 12.7 The continue statement

    function parseContinueStatement() {
        var token, label = null;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source[index] === ';') {
            lex();

            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return {
                type: Syntax.ContinueStatement,
                label: null
            };
        }

        if (peekLineTerminator()) {
            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return {
                type: Syntax.ContinueStatement,
                label: null
            };
        }

        token = lookahead();
        if (token.type === Token.Identifier) {
            label = parseVariableIdentifier();

            if (!Object.prototype.hasOwnProperty.call(state.labelSet, label.name)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return {
            type: Syntax.ContinueStatement,
            label: label
        };
    }

    // 12.8 The break statement

    function parseBreakStatement() {
        var token, label = null;

        expectKeyword('break');

        // Optimize the most common form: 'break;'.
        if (source[index] === ';') {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return {
                type: Syntax.BreakStatement,
                label: null
            };
        }

        if (peekLineTerminator()) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return {
                type: Syntax.BreakStatement,
                label: null
            };
        }

        token = lookahead();
        if (token.type === Token.Identifier) {
            label = parseVariableIdentifier();

            if (!Object.prototype.hasOwnProperty.call(state.labelSet, label.name)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return {
            type: Syntax.BreakStatement,
            label: label
        };
    }

    // 12.9 The return statement

    function parseReturnStatement() {
        var token, argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            throwErrorTolerant({}, Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source[index] === ' ') {
            if (isIdentifierStart(source[index + 1])) {
                argument = parseExpression();
                consumeSemicolon();
                return {
                    type: Syntax.ReturnStatement,
                    argument: argument
                };
            }
        }

        if (peekLineTerminator()) {
            return {
                type: Syntax.ReturnStatement,
                argument: null
            };
        }

        if (!match(';')) {
            token = lookahead();
            if (!match('}') && token.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return {
            type: Syntax.ReturnStatement,
            argument: argument
        };
    }

    // 12.10 The with statement

    function parseWithStatement() {
        var object, body;

        if (strict) {
            throwErrorTolerant({}, Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return {
            type: Syntax.WithStatement,
            object: object,
            body: body
        };
    }

    // 12.10 The swith statement

    function parseSwitchCase() {
        var test,
            consequent = [],
            statement;

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatement();
            if (typeof statement === 'undefined') {
                break;
            }
            consequent.push(statement);
        }

        return {
            type: Syntax.SwitchCase,
            test: test,
            consequent: consequent
        };
    }

    function parseSwitchStatement() {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant,
                cases: cases
            };
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (index < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError({}, Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return {
            type: Syntax.SwitchStatement,
            discriminant: discriminant,
            cases: cases
        };
    }

    // 12.13 The throw statement

    function parseThrowStatement() {
        var argument;

        expectKeyword('throw');

        if (peekLineTerminator()) {
            throwError({}, Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return {
            type: Syntax.ThrowStatement,
            argument: argument
        };
    }

    // 12.14 The try statement

    function parseCatchClause() {
        var param;

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpected(lookahead());
        }

        param = parseVariableIdentifier();
        // 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            throwErrorTolerant({}, Messages.StrictCatchVariable);
        }

        expect(')');

        return {
            type: Syntax.CatchClause,
            param: param,
            body: parseBlock()
        };
    }

    function parseTryStatement() {
        var block, handlers = [], finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handlers.push(parseCatchClause());
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (handlers.length === 0 && !finalizer) {
            throwError({}, Messages.NoCatchOrFinally);
        }

        return {
            type: Syntax.TryStatement,
            block: block,
            guardedHandlers: [],
            handlers: handlers,
            finalizer: finalizer
        };
    }

    // 12.15 The debugger statement

    function parseDebuggerStatement() {
        expectKeyword('debugger');

        consumeSemicolon();

        return {
            type: Syntax.DebuggerStatement
        };
    }

    // 12 Statements

    function parseStatement() {
        var token = lookahead(),
            expr,
            labeledBody;

        if (token.type === Token.EOF) {
            throwUnexpected(token);
        }

        if (token.type === Token.Punctuator) {
            switch (token.value) {
            case ';':
                return parseEmptyStatement();
            case '{':
                return parseBlock();
            case '(':
                return parseExpressionStatement();
            default:
                break;
            }
        }

        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'break':
                return parseBreakStatement();
            case 'continue':
                return parseContinueStatement();
            case 'debugger':
                return parseDebuggerStatement();
            case 'do':
                return parseDoWhileStatement();
            case 'for':
                return parseForStatement();
            case 'function':
                return parseFunctionDeclaration();
            case 'if':
                return parseIfStatement();
            case 'return':
                return parseReturnStatement();
            case 'switch':
                return parseSwitchStatement();
            case 'throw':
                return parseThrowStatement();
            case 'try':
                return parseTryStatement();
            case 'var':
                return parseVariableStatement();
            case 'while':
                return parseWhileStatement();
            case 'with':
                return parseWithStatement();
            default:
                break;
            }
        }

        expr = parseExpression();

        // 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            if (Object.prototype.hasOwnProperty.call(state.labelSet, expr.name)) {
                throwError({}, Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[expr.name] = true;
            labeledBody = parseStatement();
            delete state.labelSet[expr.name];

            return {
                type: Syntax.LabeledStatement,
                label: expr,
                body: labeledBody
            };
        }

        consumeSemicolon();

        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }

    // 13 Function Definition

    function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody;

        expect('{');

        while (index < length) {
            token = lookahead();
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;

        while (index < length) {
            if (match('}')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;

        return {
            type: Syntax.BlockStatement,
            body: sourceElements
        };
    }

    function parseFunctionDeclaration() {
        var id, param, params = [], body, token, stricted, firstRestricted, message, previousStrict, paramSet;

        expectKeyword('function');
        token = lookahead();
        id = parseVariableIdentifier();
        if (strict) {
            if (isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
            }
        } else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }

        expect('(');

        if (!match(')')) {
            paramSet = {};
            while (index < length) {
                token = lookahead();
                param = parseVariableIdentifier();
                if (strict) {
                    if (isRestrictedWord(token.value)) {
                        stricted = token;
                        message = Messages.StrictParamName;
                    }
                    if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                        stricted = token;
                        message = Messages.StrictParamDupe;
                    }
                } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictReservedWord;
                    } else if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamDupe;
                    }
                }
                params.push(param);
                paramSet[param.name] = true;
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return {
            type: Syntax.FunctionDeclaration,
            id: id,
            params: params,
            defaults: [],
            body: body,
            rest: null,
            generator: false,
            expression: false
        };
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, param, params = [], body, previousStrict, paramSet;

        expectKeyword('function');

        if (!match('(')) {
            token = lookahead();
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        expect('(');

        if (!match(')')) {
            paramSet = {};
            while (index < length) {
                token = lookahead();
                param = parseVariableIdentifier();
                if (strict) {
                    if (isRestrictedWord(token.value)) {
                        stricted = token;
                        message = Messages.StrictParamName;
                    }
                    if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                        stricted = token;
                        message = Messages.StrictParamDupe;
                    }
                } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictReservedWord;
                    } else if (Object.prototype.hasOwnProperty.call(paramSet, token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamDupe;
                    }
                }
                params.push(param);
                paramSet[param.name] = true;
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return {
            type: Syntax.FunctionExpression,
            id: id,
            params: params,
            defaults: [],
            body: body,
            rest: null,
            generator: false,
            expression: false
        };
    }

    // 14 Program

    function parseSourceElement() {
        var token = lookahead();

        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'const':
            case 'let':
                return parseConstLetDeclaration(token.value);
            case 'function':
                return parseFunctionDeclaration();
            default:
                return parseStatement();
            }
        }

        if (token.type !== Token.EOF) {
            return parseStatement();
        }
    }

    function parseSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;

        while (index < length) {
            token = lookahead();
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (index < length) {
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }

    function parseProgram() {
        var program;
        strict = false;
        program = {
            type: Syntax.Program,
            body: parseSourceElements()
        };
        return program;
    }

    // The following functions are needed only when the option to preserve
    // the comments is active.

    function addComment(type, value, start, end, loc) {
        assert(typeof start === 'number', 'Comment must have valid position');

        // Because the way the actual token is scanned, often the comments
        // (if any) are skipped twice during the lexical analysis.
        // Thus, we need to skip adding a comment if the comment array already
        // handled it.
        if (extra.comments.length > 0) {
            if (extra.comments[extra.comments.length - 1].range[1] > start) {
                return;
            }
        }

        extra.comments.push({
            type: type,
            value: value,
            range: [start, end],
            loc: loc
        });
    }

    function scanComment() {
        var comment, ch, loc, start, blockComment, lineComment;

        comment = '';
        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                ch = source[index++];
                if (isLineTerminator(ch)) {
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    lineComment = false;
                    addComment('Line', comment, start, index - 1, loc);
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                    comment = '';
                } else if (index >= length) {
                    lineComment = false;
                    comment += ch;
                    loc.end = {
                        line: lineNumber,
                        column: length - lineStart
                    };
                    addComment('Line', comment, start, length, loc);
                } else {
                    comment += ch;
                }
            } else if (blockComment) {
                if (isLineTerminator(ch)) {
                    if (ch === '\r' && source[index + 1] === '\n') {
                        ++index;
                        comment += '\r\n';
                    } else {
                        comment += ch;
                    }
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    ch = source[index++];
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    comment += ch;
                    if (ch === '*') {
                        ch = source[index];
                        if (ch === '/') {
                            comment = comment.substr(0, comment.length - 1);
                            blockComment = false;
                            ++index;
                            loc.end = {
                                line: lineNumber,
                                column: index - lineStart
                            };
                            addComment('Block', comment, start, index, loc);
                            comment = '';
                        }
                    }
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    loc = {
                        start: {
                            line: lineNumber,
                            column: index - lineStart
                        }
                    };
                    start = index;
                    index += 2;
                    lineComment = true;
                    if (index >= length) {
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        lineComment = false;
                        addComment('Line', comment, start, index, loc);
                    }
                } else if (ch === '*') {
                    start = index;
                    index += 2;
                    blockComment = true;
                    loc = {
                        start: {
                            line: lineNumber,
                            column: index - lineStart - 2
                        }
                    };
                    if (index >= length) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch ===  '\r' && source[index] === '\n') {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
            } else {
                break;
            }
        }
    }

    function filterCommentLocation() {
        var i, entry, comment, comments = [];

        for (i = 0; i < extra.comments.length; ++i) {
            entry = extra.comments[i];
            comment = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                comment.range = entry.range;
            }
            if (extra.loc) {
                comment.loc = entry.loc;
            }
            comments.push(comment);
        }

        extra.comments = comments;
    }

    function collectToken() {
        var start, loc, token, range, value;

        skipComment();
        start = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = extra.advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            range = [token.range[0], token.range[1]];
            value = sliceSource(token.range[0], token.range[1]);
            extra.tokens.push({
                type: TokenName[token.type],
                value: value,
                range: range,
                loc: loc
            });
        }

        return token;
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = extra.scanRegExp();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        // Pop the previous token, which is likely '/' or '/='
        if (extra.tokens.length > 0) {
            token = extra.tokens[extra.tokens.length - 1];
            if (token.range[0] === pos && token.type === 'Punctuator') {
                if (token.value === '/' || token.value === '/=') {
                    extra.tokens.pop();
                }
            }
        }

        extra.tokens.push({
            type: 'RegularExpression',
            value: regex.literal,
            range: [pos, index],
            loc: loc
        });

        return regex;
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function createLiteral(token) {
        return {
            type: Syntax.Literal,
            value: token.value
        };
    }

    function createRawLiteral(token) {
        return {
            type: Syntax.Literal,
            value: token.value,
            raw: sliceSource(token.range[0], token.range[1])
        };
    }

    function createLocationMarker() {
        var marker = {};

        marker.range = [index, index];
        marker.loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            },
            end: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        marker.end = function () {
            this.range[1] = index;
            this.loc.end.line = lineNumber;
            this.loc.end.column = index - lineStart;
        };

        marker.applyGroup = function (node) {
            if (extra.range) {
                node.groupRange = [this.range[0], this.range[1]];
            }
            if (extra.loc) {
                node.groupLoc = {
                    start: {
                        line: this.loc.start.line,
                        column: this.loc.start.column
                    },
                    end: {
                        line: this.loc.end.line,
                        column: this.loc.end.column
                    }
                };
            }
        };

        marker.apply = function (node) {
            if (extra.range) {
                node.range = [this.range[0], this.range[1]];
            }
            if (extra.loc) {
                node.loc = {
                    start: {
                        line: this.loc.start.line,
                        column: this.loc.start.column
                    },
                    end: {
                        line: this.loc.end.line,
                        column: this.loc.end.column
                    }
                };
            }
        };

        return marker;
    }

    function trackGroupExpression() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();
        expect('(');

        expr = parseExpression();

        expect(')');

        marker.end();
        marker.applyGroup(expr);

        return expr;
    }

    function trackLeftHandSideExpression() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[')) {
            if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
                marker.end();
                marker.apply(expr);
            } else {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }

    function trackLeftHandSideExpressionAllowCall() {
        var marker, expr;

        skipComment();
        marker = createLocationMarker();

        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();

        while (match('.') || match('[') || match('(')) {
            if (match('(')) {
                expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    'arguments': parseArguments()
                };
                marker.end();
                marker.apply(expr);
            } else if (match('[')) {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember()
                };
                marker.end();
                marker.apply(expr);
            } else {
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember()
                };
                marker.end();
                marker.apply(expr);
            }
        }

        return expr;
    }

    function filterGroup(node) {
        var n, i, entry;

        n = (Object.prototype.toString.apply(node) === '[object Array]') ? [] : {};
        for (i in node) {
            if (node.hasOwnProperty(i) && i !== 'groupRange' && i !== 'groupLoc') {
                entry = node[i];
                if (entry === null || typeof entry !== 'object' || entry instanceof RegExp) {
                    n[i] = entry;
                } else {
                    n[i] = filterGroup(entry);
                }
            }
        }
        return n;
    }

    function wrapTrackingFunction(range, loc) {

        return function (parseFunction) {

            function isBinary(node) {
                return node.type === Syntax.LogicalExpression ||
                    node.type === Syntax.BinaryExpression;
            }

            function visit(node) {
                var start, end;

                if (isBinary(node.left)) {
                    visit(node.left);
                }
                if (isBinary(node.right)) {
                    visit(node.right);
                }

                if (range) {
                    if (node.left.groupRange || node.right.groupRange) {
                        start = node.left.groupRange ? node.left.groupRange[0] : node.left.range[0];
                        end = node.right.groupRange ? node.right.groupRange[1] : node.right.range[1];
                        node.range = [start, end];
                    } else if (typeof node.range === 'undefined') {
                        start = node.left.range[0];
                        end = node.right.range[1];
                        node.range = [start, end];
                    }
                }
                if (loc) {
                    if (node.left.groupLoc || node.right.groupLoc) {
                        start = node.left.groupLoc ? node.left.groupLoc.start : node.left.loc.start;
                        end = node.right.groupLoc ? node.right.groupLoc.end : node.right.loc.end;
                        node.loc = {
                            start: start,
                            end: end
                        };
                    } else if (typeof node.loc === 'undefined') {
                        node.loc = {
                            start: node.left.loc.start,
                            end: node.right.loc.end
                        };
                    }
                }
            }

            return function () {
                var marker, node;

                skipComment();

                marker = createLocationMarker();
                node = parseFunction.apply(null, arguments);
                marker.end();

                if (range && typeof node.range === 'undefined') {
                    marker.apply(node);
                }

                if (loc && typeof node.loc === 'undefined') {
                    marker.apply(node);
                }

                if (isBinary(node)) {
                    visit(node);
                }

                return node;
            };
        };
    }

    function patch() {

        var wrapTracking;

        if (extra.comments) {
            extra.skipComment = skipComment;
            skipComment = scanComment;
        }

        if (extra.raw) {
            extra.createLiteral = createLiteral;
            createLiteral = createRawLiteral;
        }

        if (extra.range || extra.loc) {

            extra.parseGroupExpression = parseGroupExpression;
            extra.parseLeftHandSideExpression = parseLeftHandSideExpression;
            extra.parseLeftHandSideExpressionAllowCall = parseLeftHandSideExpressionAllowCall;
            parseGroupExpression = trackGroupExpression;
            parseLeftHandSideExpression = trackLeftHandSideExpression;
            parseLeftHandSideExpressionAllowCall = trackLeftHandSideExpressionAllowCall;

            wrapTracking = wrapTrackingFunction(extra.range, extra.loc);

            extra.parseAdditiveExpression = parseAdditiveExpression;
            extra.parseAssignmentExpression = parseAssignmentExpression;
            extra.parseBitwiseANDExpression = parseBitwiseANDExpression;
            extra.parseBitwiseORExpression = parseBitwiseORExpression;
            extra.parseBitwiseXORExpression = parseBitwiseXORExpression;
            extra.parseBlock = parseBlock;
            extra.parseFunctionSourceElements = parseFunctionSourceElements;
            extra.parseCatchClause = parseCatchClause;
            extra.parseComputedMember = parseComputedMember;
            extra.parseConditionalExpression = parseConditionalExpression;
            extra.parseConstLetDeclaration = parseConstLetDeclaration;
            extra.parseEqualityExpression = parseEqualityExpression;
            extra.parseExpression = parseExpression;
            extra.parseForVariableDeclaration = parseForVariableDeclaration;
            extra.parseFunctionDeclaration = parseFunctionDeclaration;
            extra.parseFunctionExpression = parseFunctionExpression;
            extra.parseLogicalANDExpression = parseLogicalANDExpression;
            extra.parseLogicalORExpression = parseLogicalORExpression;
            extra.parseMultiplicativeExpression = parseMultiplicativeExpression;
            extra.parseNewExpression = parseNewExpression;
            extra.parseNonComputedProperty = parseNonComputedProperty;
            extra.parseObjectProperty = parseObjectProperty;
            extra.parseObjectPropertyKey = parseObjectPropertyKey;
            extra.parsePostfixExpression = parsePostfixExpression;
            extra.parsePrimaryExpression = parsePrimaryExpression;
            extra.parseProgram = parseProgram;
            extra.parsePropertyFunction = parsePropertyFunction;
            extra.parseRelationalExpression = parseRelationalExpression;
            extra.parseStatement = parseStatement;
            extra.parseShiftExpression = parseShiftExpression;
            extra.parseSwitchCase = parseSwitchCase;
            extra.parseUnaryExpression = parseUnaryExpression;
            extra.parseVariableDeclaration = parseVariableDeclaration;
            extra.parseVariableIdentifier = parseVariableIdentifier;

            parseAdditiveExpression = wrapTracking(extra.parseAdditiveExpression);
            parseAssignmentExpression = wrapTracking(extra.parseAssignmentExpression);
            parseBitwiseANDExpression = wrapTracking(extra.parseBitwiseANDExpression);
            parseBitwiseORExpression = wrapTracking(extra.parseBitwiseORExpression);
            parseBitwiseXORExpression = wrapTracking(extra.parseBitwiseXORExpression);
            parseBlock = wrapTracking(extra.parseBlock);
            parseFunctionSourceElements = wrapTracking(extra.parseFunctionSourceElements);
            parseCatchClause = wrapTracking(extra.parseCatchClause);
            parseComputedMember = wrapTracking(extra.parseComputedMember);
            parseConditionalExpression = wrapTracking(extra.parseConditionalExpression);
            parseConstLetDeclaration = wrapTracking(extra.parseConstLetDeclaration);
            parseEqualityExpression = wrapTracking(extra.parseEqualityExpression);
            parseExpression = wrapTracking(extra.parseExpression);
            parseForVariableDeclaration = wrapTracking(extra.parseForVariableDeclaration);
            parseFunctionDeclaration = wrapTracking(extra.parseFunctionDeclaration);
            parseFunctionExpression = wrapTracking(extra.parseFunctionExpression);
            parseLeftHandSideExpression = wrapTracking(parseLeftHandSideExpression);
            parseLogicalANDExpression = wrapTracking(extra.parseLogicalANDExpression);
            parseLogicalORExpression = wrapTracking(extra.parseLogicalORExpression);
            parseMultiplicativeExpression = wrapTracking(extra.parseMultiplicativeExpression);
            parseNewExpression = wrapTracking(extra.parseNewExpression);
            parseNonComputedProperty = wrapTracking(extra.parseNonComputedProperty);
            parseObjectProperty = wrapTracking(extra.parseObjectProperty);
            parseObjectPropertyKey = wrapTracking(extra.parseObjectPropertyKey);
            parsePostfixExpression = wrapTracking(extra.parsePostfixExpression);
            parsePrimaryExpression = wrapTracking(extra.parsePrimaryExpression);
            parseProgram = wrapTracking(extra.parseProgram);
            parsePropertyFunction = wrapTracking(extra.parsePropertyFunction);
            parseRelationalExpression = wrapTracking(extra.parseRelationalExpression);
            parseStatement = wrapTracking(extra.parseStatement);
            parseShiftExpression = wrapTracking(extra.parseShiftExpression);
            parseSwitchCase = wrapTracking(extra.parseSwitchCase);
            parseUnaryExpression = wrapTracking(extra.parseUnaryExpression);
            parseVariableDeclaration = wrapTracking(extra.parseVariableDeclaration);
            parseVariableIdentifier = wrapTracking(extra.parseVariableIdentifier);
        }

        if (typeof extra.tokens !== 'undefined') {
            extra.advance = advance;
            extra.scanRegExp = scanRegExp;

            advance = collectToken;
            scanRegExp = collectRegex;
        }
    }

    function unpatch() {
        if (typeof extra.skipComment === 'function') {
            skipComment = extra.skipComment;
        }

        if (extra.raw) {
            createLiteral = extra.createLiteral;
        }

        if (extra.range || extra.loc) {
            parseAdditiveExpression = extra.parseAdditiveExpression;
            parseAssignmentExpression = extra.parseAssignmentExpression;
            parseBitwiseANDExpression = extra.parseBitwiseANDExpression;
            parseBitwiseORExpression = extra.parseBitwiseORExpression;
            parseBitwiseXORExpression = extra.parseBitwiseXORExpression;
            parseBlock = extra.parseBlock;
            parseFunctionSourceElements = extra.parseFunctionSourceElements;
            parseCatchClause = extra.parseCatchClause;
            parseComputedMember = extra.parseComputedMember;
            parseConditionalExpression = extra.parseConditionalExpression;
            parseConstLetDeclaration = extra.parseConstLetDeclaration;
            parseEqualityExpression = extra.parseEqualityExpression;
            parseExpression = extra.parseExpression;
            parseForVariableDeclaration = extra.parseForVariableDeclaration;
            parseFunctionDeclaration = extra.parseFunctionDeclaration;
            parseFunctionExpression = extra.parseFunctionExpression;
            parseGroupExpression = extra.parseGroupExpression;
            parseLeftHandSideExpression = extra.parseLeftHandSideExpression;
            parseLeftHandSideExpressionAllowCall = extra.parseLeftHandSideExpressionAllowCall;
            parseLogicalANDExpression = extra.parseLogicalANDExpression;
            parseLogicalORExpression = extra.parseLogicalORExpression;
            parseMultiplicativeExpression = extra.parseMultiplicativeExpression;
            parseNewExpression = extra.parseNewExpression;
            parseNonComputedProperty = extra.parseNonComputedProperty;
            parseObjectProperty = extra.parseObjectProperty;
            parseObjectPropertyKey = extra.parseObjectPropertyKey;
            parsePrimaryExpression = extra.parsePrimaryExpression;
            parsePostfixExpression = extra.parsePostfixExpression;
            parseProgram = extra.parseProgram;
            parsePropertyFunction = extra.parsePropertyFunction;
            parseRelationalExpression = extra.parseRelationalExpression;
            parseStatement = extra.parseStatement;
            parseShiftExpression = extra.parseShiftExpression;
            parseSwitchCase = extra.parseSwitchCase;
            parseUnaryExpression = extra.parseUnaryExpression;
            parseVariableDeclaration = extra.parseVariableDeclaration;
            parseVariableIdentifier = extra.parseVariableIdentifier;
        }

        if (typeof extra.scanRegExp === 'function') {
            advance = extra.advance;
            scanRegExp = extra.scanRegExp;
        }
    }

    function stringToArray(str) {
        var length = str.length,
            result = [],
            i;
        for (i = 0; i < length; ++i) {
            result[i] = str.charAt(i);
        }
        return result;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        buffer = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false
        };

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.raw = (typeof options.raw === 'boolean') && options.raw;
            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
        }

        if (length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }

                // Force accessing the characters via an array.
                if (typeof source[0] === 'undefined') {
                    source = stringToArray(code);
                }
            }
        }

        patch();
        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                filterCommentLocation();
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
            if (extra.range || extra.loc) {
                program.body = filterGroup(program.body);
            }
        } catch (e) {
            throw e;
        } finally {
            unpatch();
            extra = {};
        }

        return program;
    }

    // Sync with package.json.
    exports.version = '1.0.4';

    exports.parse = parse;

    // Deep copy.
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],33:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports); // CommonJS
  } else {
    var mustache = {};
    factory(mustache);
    if (typeof define === "function" && define.amd) {
      define(mustache); // AMD
    } else {
      root.Mustache = mustache; // <script>
    }
  }
}(this, function (mustache) {

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var RegExp_test = RegExp.prototype.test;
  function testRegExp(re, string) {
    return RegExp_test.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var Object_toString = Object.prototype.toString;
  var isArray = Array.isArray || function (object) {
    return Object_toString.call(object) === '[object Array]';
  };

  function isFunction(object) {
    return typeof object === 'function';
  }

  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function escapeTags(tags) {
    if (!isArray(tags) || tags.length !== 2) {
      throw new Error('Invalid tags: ' + tags);
    }

    return [
      new RegExp(escapeRegExp(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRegExp(tags[1]))
    ];
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate(template, tags) {
    tags = tags || mustache.tags;
    template = template || '';

    if (typeof tags === 'string') {
      tags = tags.split(spaceRe);
    }

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          delete tokens[spaces.pop()];
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(tagRes[0]);
      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(['text', chr, start, start + 1]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n') {
            stripSpace();
          }
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) break;
      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === '{') {
        value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = '&';
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) {
        throw new Error('Unclosed tag at ' + scanner.pos);
      }

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection) {
          throw new Error('Unopened section "' + value + '" at ' + start);
        }
        if (openSection[1] !== value) {
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
        }
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        tagRes = escapeTags(tags = value.split(spaceRe));
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();
    if (openSection) {
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
    }

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
      case '^':
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case '/':
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      var string = match[0];
      this.tail = this.tail.substring(string.length);
      this.pos += string.length;
      return string;
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var index = this.tail.search(re), match;

    switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context(view, parentContext) {
    this.view = view == null ? {} : view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function (name) {
    var value;
    if (name in this.cache) {
      value = this.cache[name];
    } else {
      var context = this;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;

          var names = name.split('.'), i = 0;
          while (value != null && i < names.length) {
            value = value[names[i++]];
          }
        } else {
          value = context.view[name];
        }

        if (value != null) break;

        context = context.parent;
      }

      this.cache[name] = value;
    }

    if (isFunction(value)) {
      value = value.call(this.view);
    }

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer() {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null) {
      tokens = cache[template] = parseTemplate(template, tags);
    }

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function (tokens, context, partials, originalTemplate) {
    var buffer = '';

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    var self = this;
    function subRender(template) {
      return self.render(template, context, partials);
    }

    var token, value;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
        value = context.lookup(token[1]);
        if (!value) continue;

        if (isArray(value)) {
          for (var j = 0, jlen = value.length; j < jlen; ++j) {
            buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
          }
        } else if (typeof value === 'object' || typeof value === 'string') {
          buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
        } else if (isFunction(value)) {
          if (typeof originalTemplate !== 'string') {
            throw new Error('Cannot use higher-order sections without the original template');
          }

          // Extract the portion of the original template that the section contains.
          value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

          if (value != null) buffer += value;
        } else {
          buffer += this.renderTokens(token[4], context, partials, originalTemplate);
        }

        break;
      case '^':
        value = context.lookup(token[1]);

        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if (!value || (isArray(value) && value.length === 0)) {
          buffer += this.renderTokens(token[4], context, partials, originalTemplate);
        }

        break;
      case '>':
        if (!partials) continue;
        value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
        if (value != null) buffer += this.renderTokens(this.parse(value), context, partials, value);
        break;
      case '&':
        value = context.lookup(token[1]);
        if (value != null) buffer += value;
        break;
      case 'name':
        value = context.lookup(token[1]);
        if (value != null) buffer += mustache.escape(value);
        break;
      case 'text':
        buffer += token[1];
        break;
      }
    }

    return buffer;
  };

  mustache.name = "mustache.js";
  mustache.version = "0.8.1";
  mustache.tags = [ "{{", "}}" ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function (template, view, partials) {
    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  mustache.to_html = function (template, view, partials, send) {
    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

}));

},{}],34:[function(require,module,exports){
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

},{}],35:[function(require,module,exports){
"use strict";


module.exports = Context;



function Context(_bounds, _matrix) {
	this.bounds = _bounds ? _bounds.clone() : new paper.Rectangle(0, 0, 0, 0);
	this.matrix = _matrix ? _matrix.clone() : new paper.Matrix();
}

Context.prototype.toString = function() {
	return "Context: " + this.bounds;
};


Context.prototype.deriveContext = function(_properties) {

	// Calculate Bounds
	var derivedBounds = new paper.Rectangle();

	derivedBounds.top = deriveBound(
		this.bounds.top, this.bounds.bottom,
		_properties.top, _properties.margin_top, _properties.bottom, _properties.margin_bottom, _properties.height, -1
	);

	derivedBounds.bottom = deriveBound(
		this.bounds.bottom, this.bounds.top,
		_properties.bottom, _properties.margin_bottom, _properties.top, _properties.margin_top, _properties.height, 1
	);

	derivedBounds.left = deriveBound(
		this.bounds.left, this.bounds.right,
		_properties.left, _properties.margin_left, _properties.right, _properties.margin_right, _properties.width, -1
	);

	derivedBounds.right = deriveBound(
		this.bounds.right, this.bounds.left,
		_properties.right, _properties.margin_right, _properties.left, _properties.margin_left, _properties.width, 1
	);



	// Calculate Matrix
	var derivedMatrix = this.matrix.clone();
	var derivedContext = new Context(derivedBounds, derivedMatrix);

	if (_properties.registration === "center") {
		derivedContext.moveRegistration(derivedContext.bounds.center.x, derivedContext.bounds.center.y);
	}
	if (_properties.registration === "top") {
		derivedContext.moveRegistration(derivedContext.bounds.center.x, derivedContext.bounds.top);
	}
	if (_properties.registration === "bottom") {
		derivedContext.moveRegistration(derivedContext.bounds.center.x, derivedContext.bounds.bottom);
	}
	if (_properties.registration === "left") {
		derivedContext.moveRegistration(derivedContext.bounds.left, derivedContext.bounds.center.y);
	}
	if (_properties.registration === "right") {
		derivedContext.moveRegistration(derivedContext.bounds.right, derivedContext.bounds.center.y);
	}
	if (_properties.registration === "top_left") {
		derivedContext.moveRegistration(derivedContext.bounds.left, derivedContext.bounds.top);
	}
	if (_properties.registration === "top_right") {
		derivedContext.moveRegistration(derivedContext.bounds.right, derivedContext.bounds.top);
	}
	if (_properties.registration === "bottom_left") {
		derivedContext.moveRegistration(derivedContext.bounds.left, derivedContext.bounds.bottom);
	}
	if (_properties.registration === "bottom_right") {
		derivedContext.moveRegistration(derivedContext.bounds.right, derivedContext.bounds.bottom);
	}
	
	if (_properties.translate_x || _properties.translate_y) {
		derivedContext.matrix.translate(_properties.translate_x || 0, _properties.translate_y || 0);
	}

	if (_properties.rotation) {
		derivedContext.matrix.rotate(_properties.rotation);
	}

	if (_properties.scale_x || _properties.scale_y) {
		derivedContext.matrix.scale(_properties.scale_x || 1, _properties.scale_y || 1);
	}


	return derivedContext;
};


Context.prototype.moveRegistration = function(_x, _y) {
	this.bounds.x -= _x;
	this.bounds.y -= _y;
	this.matrix.translate(_x, _y);
};

Context.prototype.centerRegistration = function() {
	var oldCenter = this.bounds.center;
	this.bounds.x -= oldCenter.x;
	this.bounds.y -= oldCenter.y;
	this.matrix.translate(oldCenter);
};



function deriveBound(parentBound, parentOppositeBound, positionRelative, boundRelative, oppositePositionRelative, oppositeBoundRelative, dimension, direction) {

	if (typeof positionRelative === "number") {
		return positionRelative;
	}

	else if (typeof boundRelative === "number") {
		return parentBound + boundRelative * -direction;
	}

	else if (typeof oppositePositionRelative === "number" && typeof dimension === "number") {
		return oppositePositionRelative + dimension * direction;
	}

	else if (typeof oppositeBoundRelative === "number" && typeof dimension === "number") {
		return (parentOppositeBound + oppositeBoundRelative * direction) + dimension * direction;
	}

	else if (typeof dimension === "number") {
		return (dimension * 0.5 * direction);
	}

	else if (typeof oppositePositionRelative === "number") {
		return oppositePositionRelative;
	}

	else {
		return parentBound;
	}
}

},{}],36:[function(require,module,exports){
'use strict';

var _ = require('underscore');
var jsYAML = require('js-yaml');
var log = require('./ui/Log.js').sharedInstance();
var language = require('./language.js');

module.exports.parse = parse;

//////////////////////////////////////////////////////////////////////
// Parser

function parse(_yaml) {
	var data;

	log.appendMessage("Parsing YAML");
	
	// try first without injections, so that errors will have correct line numbers
	try {
		data = jsYAML.safeLoad(_yaml);
	}
	catch (e) {
		return log.appendParseError(e);
	}


	_yaml = injectEditorProperties(_yaml);

	// parse again, for real this time
	try {
		data = jsYAML.safeLoad(_yaml);
	}
	catch (e) {
		return log.appendParseError(e);
	}

	if (data === null || typeof data !== "object") {
		return log.appendError("Couldn't parse YAML.");
	}

	// todo default document goes here
	if (!data.properties) data.properties = {};

	return data;
}

function injectEditorProperties(_yaml) {

	var lines = _yaml.split("\n");

	var regionKeywords = _(language.regionTypes).pluck("keyword");
	regionKeywords = _(regionKeywords).filter( function(_value) {
		return _value; // remove untruthy values
	});
	regionKeywords = "(?:" + regionKeywords.join("|") + ")";
	// console.log(regionKeywords);
	var mapPattern = new RegExp(regionKeywords+":\\s*$");

	var firstLine;
	var lastLine;

	var ranges = [];

	var documentData = {
		firstLine: 0,
		lastLine: lines.length
	};


	for (var i = 0; i < lines.length; i++) {

		var isTarget = mapPattern.test(lines[i]);

		if (isTarget) {
			var indent = "    ";
			var whitespace = /^(\s*)/.exec(lines[i])[1];

			for (var ii = i + 1; ii < lines.length; ii++) {
				if (lines[ii].trim() === '') {
					continue;
				}
				if (lines[ii].indexOf(whitespace + indent) !== 0) {
					break;
				}
			}

			firstLine = i;
			lastLine = ii - 1;
			ranges.push({
				firstLine: firstLine,
				lastLine: lastLine,
				injectIndent: whitespace + indent
			});
		}
	}

	for (var r = ranges.length - 1; r >= 0; r--) {
		var data = {
			firstLine: ranges[r].firstLine,
			lastLine: ranges[r].lastLine
		};
		var injection = ranges[r].injectIndent + "editor_properties: " + JSON.stringify(data);
		lines.splice(ranges[r].firstLine + 1, 0, injection);
	}


	lines.splice(0, 0, "editor_properties: " + JSON.stringify(documentData));

	// console.log(lines.join("\n"));

	return lines.join("\n");


}


},{"./language.js":39,"./ui/Log.js":48,"js-yaml":2,"underscore":34}],37:[function(require,module,exports){
require('./jquery_util.js');
var _ = require('underscore');
var Mustache = require('mustache');
var language = require('./language.js');
var Preview = require('./ui/Preview.js');
var regionTypes = require('./region/regionTypes.js');
var Parser = require('./Parser.js');

function populateTemplates() {
	// prepare data
	var data = {};

	data.regionTypes = _(language.regionTypes).values();
	_(regionTypes).each(function(type){
		type.required_properties = _(type.properties).filter( function(prop) {
			return prop.required && prop.required === true;
		});
		
		type.properties = _(type.properties).difference(type.required_properties);
		
		if (type.extends && language.regionTypes[type.extends]) {
			type.inherited_properties = language.regionTypes[type.extends].properties;
		}
	});


	var menuTemplate = $('#template-menu').html();
	Mustache.parse(menuTemplate); // optional, speeds up future uses
	var menuRendered = Mustache.render(menuTemplate, data);
	$('#template-menu').html(menuRendered);

	var template = $('#template-regionTypes').html().replace(/&gt;/g, ">");
	var propertyTemplate = $('#template-property').html();
	var rendered = Mustache.to_html(template, data, {prop: propertyTemplate});
	$('#template-regionTypes').html(rendered);


	//enable property clicking

	//close inheretid properties
	$(".properties.inherited-properties li").addClass("closed");

	//make properties clickable
	$(".property-name").css("cursor", "pointer");
	$(".property-name").click(
		function() {
			$(this).parent().toggleClass("closed");
		}
	);
}


function renderExamples() {
	$('pre').each( function(_index, _element) {
		var source = $(_element).text();
		console.log("source", source);
		var data = Parser.parse(source);
		if (!data) return;

		var doc = new regionTypes.Document();
		doc.loadData(data);
		console.log("doc", data, doc.properties);
		doc.properties.left = 0;
		doc.properties.top = 0;
		doc.properties.width = data.properties.width || 525;
		doc.properties.height = data.properties.height || 225;
		doc.properties.registration = "center";


		var canvas = $("<canvas>")
			.attr("id", "example-"+_index)
			.attr("width", doc.properties.width + 25)
			.attr("height", doc.properties.height + 25);


		var preview = new Preview();
		preview.init(canvas.get(0));

		// UI.preview.init($('#paper-canvas').get(0));
		preview.setDocument(doc);


		canvas.insertBefore(_element);
	});

	


	$('pre').addClass('prettyprint');
	prettyPrint();
}

$(function() {

	
	populateTemplates();
	renderExamples();

	


	
});

},{"./Parser.js":36,"./jquery_util.js":38,"./language.js":39,"./region/regionTypes.js":46,"./ui/Preview.js":49,"mustache":33,"underscore":34}],38:[function(require,module,exports){
var topics = {};


jQuery.Topic = function( id ) {
    var callbacks,
        topic = id && topics[ id ];
    if ( !topic ) {
        callbacks = jQuery.Callbacks();
        topic = {
            publish: callbacks.fire,
            subscribe: callbacks.add,
            unsubscribe: callbacks.remove
        };
        if ( id ) {
            topics[ id ] = topic;
        }
    }
    return topic;
};
// Topic creates a global pub/sub dispatcher. Code jquery documentation
// http://api.jquery.com/jQuery.Callbacks/
// example usage:
// $.Topic( "mailArrived" ).subscribe( fn1 );
// $.Topic( "mailArrived" ).publish( "hello world!" );



// http://stackoverflow.com/questions/6259301/jquery-deferred-turn-failure-into-success
// http://jsfiddle.net/InfinitiesLoop/yQsYK/
jQuery.whenAll = function( firstParam ) {
    var args = arguments,
        sliceDeferred = [].slice,
        i = 0,
        length = args.length,
        count = length,
        rejected,
        deferred = length <= 1 && firstParam && jQuery.isFunction( firstParam.promise ) ? firstParam : jQuery.Deferred();
    
    function resolveFunc( i, reject ) {
        return function( value ) {
            rejected = true;
            args[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
            if ( !( --count ) ) {
                // Strange bug in FF4:
                // Values changed onto the arguments object sometimes end up as undefined values
                // outside the $.when method. Cloning the object into a fresh array solves the issue
                var fn = rejected ? deferred.rejectWith : deferred.resolveWith;
                fn.call(deferred, deferred, sliceDeferred.call( args, 0 ));
            }
        };
    }
    
    if ( length > 1 ) {
        for( ; i < length; i++ ) {
            if ( args[ i ] && jQuery.isFunction( args[ i ].promise ) ) {
                args[ i ].promise().then( resolveFunc(i), resolveFunc(i, true) );
            } else {
                --count;
            }
        }
        if ( !count ) {
            deferred.resolveWith( deferred, args );
        }
    } else if ( deferred !== firstParam ) {
        deferred.resolveWith( deferred, length ? [ firstParam ] : [] );
    }
    return deferred.promise();
};




},{}],39:[function(require,module,exports){
'use strict';

/* global regionTypes */
// requires

module.exports.regionTypes = regionTypes;
module.exports.unitScales = {
	"px": 1,
	"in": 72,
	"ft": 72*12,
	"mm": 2.83464567,
	"cm": 28.3464567,
	"m": 2834.64567
};

},{}],40:[function(require,module,exports){

// takes an array of _paths and combines the first item with all remaining items using the boolean _operation 

module.exports.combinePaths = function(_paths, _operation) {
	if (_paths.length < 1) return [];

	console.log("cp", _paths, _operation);
	
	var newPath = _paths[0];
	for (var i = 1; i < _paths.length; i++) {
		newPath.remove();
		_paths[i].remove();
		newPath = newPath[_operation](_paths[i]);
	}

	return newPath;
};

},{}],41:[function(require,module,exports){
'use strict';

var Region = require('./Region.js');
var util = require('../util.js');

module.exports = Document;

//////////////////////////////////////////////////////////////////////
// Document

function Document(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Document";
	this.waitList = [];
}

Document.prototype = Object.create(Region.prototype);
Document.prototype.constructor = Document;


},{"../util.js":50,"./Region.js":44}],42:[function(require,module,exports){
'use strict';

var _ = require('underscore');
var Region = require('./Region.js');

module.exports = Ellipse;

//////////////////////////////////////////////////////////////////////
// Ellipse

function Ellipse(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Ellipse";
	this.isShape = true;
}

Ellipse.prototype = Object.create(Region.prototype);
Ellipse.prototype.constructor = Ellipse;

Ellipse.prototype.drawBuild = function(_bounds) {
	var boundsPath = new paper.Path.Ellipse(_bounds);
	return boundsPath;
};


Ellipse.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Ellipse(_bounds);
};



},{"./Region.js":44,"underscore":34}],43:[function(require,module,exports){
'use strict';

var _ = require('underscore');
var Region = require('./Region.js');

module.exports = Rectangle;

//////////////////////////////////////////////////////////////////////
// Rectangle

function Rectangle(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Rectangle";
	this.isShape = true;
}

Rectangle.prototype = Object.create(Region.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.drawBuild = function(_bounds) {
	var boundsPath = new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
	return boundsPath;
};

Rectangle.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
};


},{"./Region.js":44,"underscore":34}],44:[function(require,module,exports){
'use strict';


var _ = require('underscore');
var paperUtil = require('../paper_util.js');
var util = require('../util.js');
var settings = require('../settings.js');
var regionTypes = require('./regionTypes.js');
var Context = require('../Context.js');

var language = require('../language.js');
var log = require('../ui/Log.js').sharedInstance(); 


module.exports = Region;



// todo move this
// maps the allowed yaml name to the coresponding paperjs function
var booleanOperations = {
	"add": "unite",
	"subtract": "subtract",
	"intersect": "intersect"
};



function Region(_parent) {
	this.type = "Region";
	this.parent = _parent || null;
	this.root = this.parent && this.parent.root || this;

	this.children = [];
	this.properties = {};
	
	this.editorProperties = {};

	this.previewBoundsGroup = null;
	this.previewPositionGroup = null;

	this.isShape = false;
}

Region.prototype.proxy = function() {
	// var proxy = new this.constructor();
	// proxy.parent = this.parent;
	// proxy.root = this.root;
	// proxy.
	var proxy = Object.create(this);
	// proxy.previewBoundsGroup = null;
	return proxy;
};


//////////////////////////////////////////////////////////////////////
// Loading

Region.prototype.loadData = function(_data) {

	if (typeof _data.editor_properties === "object" && _data.editor_properties !== null) {
		this.editorProperties = _.clone(_data.editor_properties);
	}

	if (typeof _data.properties === "object" && _data.properties !== null) {
		this.loadProperties(_data.properties);
	}

	if (typeof _data.children === "object" && _data.children !== null) {
		this.loadChildren(_data.children);
	}

	return this;
};


Region.prototype.loadProperties = function(_properties) {

	var self = this;

	//todo recurse?
	var definitions = language.regionTypes[this.type].properties;
	if (!Array.isArray(definitions)) {
		definitions = [];
	}
	var superClass = language.regionTypes[this.type].extends;
	if (superClass) {
		definitions = util.mergeObjectArraysOnKey(language.regionTypes[superClass].properties, definitions, "keyword");
	}

	

	// Build message prefix
	// todo factor this out
	var messagePrefix = this.type + ": ";
	if (this.editorProperties.firstLine) {
		messagePrefix = "[Line " + this.editorProperties.firstLine + " " + this.type + "] ";
	}

	// Validate and import provided properties.
	_(_properties).each(function(pValue, pKey) {
		var def = _(definitions).find(function(_def) {
			return _def.keyword === pKey;
		});

		if (!def) {
			log.appendWarning(messagePrefix + "Unknown property: " + pKey);
			return;
		}

		if (typeof pValue == "string" && def.type == "number" && !isNaN(pValue) && pValue !== '') {
			// try casting strings to numbers
			pValue = Number(pValue);

		}

		if (typeof pValue !== def.type) {
			log.appendWarning(messagePrefix + "Incorrect type: " + pKey + "<br />Received " + typeof pValue + ". Expected " + def.type + ".");
			return;
		}

		if (def.values && !_(def.values).contains(pValue)) {
			log.appendWarning(messagePrefix + "Unrecognized value for property: " + pKey + "<br />Received \"" + pValue + "\". Expected " + def.values.join(", ") + ".");
			return;
		}

		self.properties[pKey] = pValue;
	});


	// Populate defaults
	
	_(definitions).chain()
		.filter(function(_def) {
			return _def && _def.default;
		})
		.each(function(_def) {
			self.properties[_def.keyword] = self.properties[_def.keyword] || _def.default;
		});


	// Enforce required
	_(definitions).chain()
		.filter(function(_def) {
			return _def && _def.required === true;
		})
		.each(function(_def) {
			if (self.properties[_def.keyword] === undefined) {
				log.appendWarning(
					messagePrefix + "Missing required property: " + _def.keyword
				);
			}
		});

};

Region.prototype.loadChildren = function(_childrenData) {

	_.each(_childrenData, function(_childData) {
		var childKey = _.keys(_childData)[0];
		var childData = _.values(_childData)[0];


		var def = _(language.regionTypes).find(function(_def) {
			return _def.keyword === childKey;
		});
		var targetClass = def && def.class;


		if (targetClass && targetClass in regionTypes) {
			var child = new(regionTypes[targetClass])(this);
			child.loadData(childData);
			this.children.push(child);
		}
		else {
			if (childData.editor_properties) {
				log.appendWarning("[Line " + childData.editor_properties.firstLine + "] Unknown region type: " + childKey);
			}
			else {
				log.appendWarning("Unknown region type: " + childKey);
			}
		}

	}, this);
};


//////////////////////////////////////////////////////////////////////
// Util

Region.prototype.toString = function() {
	var s = this.type;
	if (this.editorProperties.line) {
		s += "(" + this.editorProperties.line + ")";
	}
	s += ": ";
	s += this.properties.name || "unnamed";
	return s;
};

Region.prototype.breadCrumb = function() {
	var bc = ["" + this];

	if (this.parent !== null) {
		bc = this.parent.breadCrumb().concat(bc);
	}
	return bc;
};

Region.prototype.tree = function(_depth) {
	_depth = _depth || 0;

	var text = this + "\n";

	_.each(this.children, function(_child) {
		// create indent
		_(_depth + 1).times(function(i) {
			text += "\t";
		});

		text += _child.tree(_depth + 1);
	});

	return text;
};


//////////////////////////////////////////////////////////////////////
// Preview

Region.prototype.preview = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	this.previewBoundsGroup = new paper.Group();
	this.previewPositionGroup = new paper.Group();

	this.previewBoundsGroup.onMouseEnter = _.bind(this.onMouseEnter, this);
	this.previewBoundsGroup.onMouseLeave = _.bind(this.onMouseLeave, this);
	this.previewBoundsGroup.onClick = _.bind(this.onClick, this);

	// bounds
	var bounds = this.drawBounds(context.bounds);
	bounds.transform(context.matrix);
	this.previewBoundsGroup.addChild(bounds);

	// pos
	var position = this.drawPosition(context.position, context.matrix);
	position.transform(context.matrix);
	this.previewPositionGroup.addChild(position);

	this.setStyle("default");

	// children
	this.previewChildren(context);
};


Region.prototype.previewChildren = function(_context) {
	_.each(this.children, function(_child) {
		_child.preview(_context);
	});
};



//////////////////////////////////////////////////////////////////////
// Build

Region.prototype.build = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	var ownPaths = [].concat(this.drawBuild(context.bounds));
	_.each(ownPaths, function(p) {
		p.transform(context.matrix);
	}, this);

	var childPaths = ownPaths.concat(this.buildChildren(context));


	
	if (!('boolean' in this.properties)) {
		return childPaths;
	}
	else {
		var op = booleanOperations[this.properties.boolean];
		childPaths = paperUtil.combinePaths(childPaths, op);
	}

	return childPaths;
};


Region.prototype.buildChildren = function(_context) {
	var childPaths = [];

	_.each(this.children, function(_child) {
		var s = _child.build(_context);
		childPaths = childPaths.concat(s);
	});

	return childPaths;
};

////////////////////////////////////////////////////////////////////
// Handy

Region.prototype.getDecendants = function() {
	return util.collectTree(this, "children");
};

Region.prototype.getAncestors = function() {
	var a = [];
	if (this.parent) {
		return [this.parent].concat(this.parent.getAncestors());
	}
	return [];
};



//////////////////////////////////////////////////////////////////////
// Events

Region.prototype.onMouseEnter = function() {
	$.Topic("region/onMouseEnter").publish(this);
};

Region.prototype.onClick = function() {
	$.Topic("region/onClick").publish(this);
};

Region.prototype.onMouseLeave = function() {
	$.Topic("region/onMouseLeave").publish(this);
};

Region.prototype.setStyle = function(_style, _recursive) {
	_style = _style || "default";
	if (!settings.styles.bounds[_style]) return;

	if (this.isShape) {
		this.previewBoundsGroup.style = settings.styles.shape[_style];
	} else {
		this.previewBoundsGroup.style = settings.styles.bounds[_style];
	}
	this.previewPositionGroup.style = settings.styles.position[_style];

	if (_recursive) {
		_(this.children).invoke('setStyle', _style, true);
	}
};



////////////////////////////////////////////////////////////////////
// Functions to Override


Region.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Rectangle(_bounds);
};


Region.prototype.drawBuild = function(_bounds) {
	return [];
};


Region.prototype.drawPosition = function(_bounds, _matrix) {
	var scaling = _matrix.scaling;
	var rect = new paper.Rectangle(-0.5, -0.5, 1, 1); //.scale(1/scaling.x, 1/scaling.y)
	return new paper.Path.Ellipse(rect.scale(1/scaling.x, 1/scaling.y));
};

},{"../Context.js":35,"../language.js":39,"../paper_util.js":40,"../settings.js":47,"../ui/Log.js":48,"../util.js":50,"./regionTypes.js":46,"underscore":34}],45:[function(require,module,exports){
'use strict';

var _ = require('underscore');
var Context = require('../Context.js');
var Region = require('./Region.js');

module.exports = RegionGrid;

//////////////////////////////////////////////////////////////////////
// RegionGrid

function RegionGrid(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "RegionGrid";
	this.specifiedChildren = undefined;
}

RegionGrid.prototype = Object.create(Region.prototype);
RegionGrid.prototype.constructor = RegionGrid;



RegionGrid.prototype.preview = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	this.previewBoundsGroup = new paper.Group();
	this.previewPositionGroup = new paper.Group();

	this.previewBoundsGroup.onMouseEnter = _.bind(this.onMouseEnter, this);
	this.previewBoundsGroup.onMouseLeave = _.bind(this.onMouseLeave, this);
	this.previewBoundsGroup.onClick = _.bind(this.onClick, this);


	if (!this.specifiedChildren) {
		this.generateChildren(context);
	}
	_.each(this.children, function(child) {
		child.preview(child.context);
	}, this);

	this.setStyle("default");
};

RegionGrid.prototype.build = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);



	if (!this.specifiedChildren) {
		this.generateChildren(context);
	}

	var childPaths = [];
	_.each(this.children, function(child) {
		childPaths = childPaths.concat(child.buildChildren(child.context));
	}, this);



	// var gridContexts = this.generateContexts(context);
	// var childPaths = [];
	// _.each(gridContexts, function(gridContext) {
	// 	childPaths = childPaths.concat(this.buildChildren(gridContext));
	// }, this);

	return childPaths;
};

RegionGrid.prototype.generateChildren = function(_context) {
	this.specifiedChildren = this.children;
	this.children = [];

	var gridContexts = this.generateContexts(_context);

	var i = 0;
	_.each(gridContexts, function(gridContext) {
		var gridChild = new Region();
		gridChild.parent = this;
		gridChild.editorProperties = this.editorProperties;
		gridChild.properties.name = this.properties.name + "_" + i++;
		_(this.specifiedChildren).each(function(_child) {
			var proxy = _child.proxy();
			proxy.parent = gridChild;
			gridChild.children.push(proxy);
		}, this);

		gridChild.context = gridContext;
		this.children.push(gridChild);
		// gridChild.preview(gridContext);
	}, this);
};

RegionGrid.prototype.generateContexts = function(_gridContext) {
	// calculate rows/cols to draw
	var rows = 1;
	rows = this.properties.rows || rows;
	rows = (_gridContext.bounds.height / this.properties.row_height) || rows;

	var cols = 1;
	cols = this.properties.columns || cols;
	cols = (_gridContext.bounds.width / this.properties.column_width) || cols;

	var generatedContexts = [];

	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < cols; col++) {

			// generate bounds			
			var width = _gridContext.bounds.width / cols;
			var height = _gridContext.bounds.height / rows;
			var x = _gridContext.bounds.left + col * width;
			var y = _gridContext.bounds.top + row * height;

			var gridRectangle = new paper.Rectangle(
				new paper.Point(x, y),
				new paper.Size(width, height)
			);

			// generate context
			var gridContext = new Context(gridRectangle, _gridContext.matrix);
			if (this.properties.registration === "center") {
				gridContext.centerRegistration();
			}

			generatedContexts.push(gridContext);
		}
	}

	return generatedContexts;

};

},{"../Context.js":35,"./Region.js":44,"underscore":34}],46:[function(require,module,exports){
'use strict';

module.exports = {};

module.exports.Region = require('./Region.js');
module.exports.Document = require('./Document.js');
module.exports.Rectangle = require('./Rectangle.js');
module.exports.Ellipse = require('./Ellipse.js');
module.exports.RegionGrid = require('./RegionGrid.js');


},{"./Document.js":41,"./Ellipse.js":42,"./Rectangle.js":43,"./Region.js":44,"./RegionGrid.js":45}],47:[function(require,module,exports){
'use strict';
var _ = require('underscore');

module.exports.fileURL = "../yaml/registration.yaml";
module.exports.previewCanvasWidth = 1200;
module.exports.previewCanvasHeight = 1200;
module.exports.inspectOnHover = false;



//colors
var shapeFillColor = new paper.Color(0.6, 1.0, 0.2, 0.5);
var shapeStrokeColor = new paper.Color("#738343");
var boundsStrokeColor = new paper.Color("#3ee1ff");
var highlightColor = new paper.Color("#f92772");

// Create Default Style
var defaultStyle = {
	strokeScaling: false,
	strokeColor: "black",
	strokeWidth: 1,
	fillColor: new paper.Color(0, 0, 0, 0),
	dashArray: []
};

var defaultStyles = {};
defaultStyles.default = _(defaultStyle).clone();
defaultStyles.selected = _(defaultStyle).clone();
defaultStyles.key = _(defaultStyle).clone();
defaultStyles.ghost = _(defaultStyle).clone();
defaultStyles.hover = _(defaultStyle).clone();


// Create Build Style
var buildStyle = _(defaultStyle).clone();
_(buildStyle).extend({
	fillColor: shapeFillColor,
	strokeColor: undefined
});

// Create Export Style
var exportStyle = _(defaultStyle).clone();
_(exportStyle).extend({});


// Create Preview/Frame Style - Bounds
var styles = {};
styles.bounds = $.extend(true, {}, defaultStyles);
_(styles.bounds.default).extend({
	strokeColor: boundsStrokeColor
});
_(styles.bounds.selected).extend({
	strokeColor: highlightColor,
	strokeWidth: 1
});
_(styles.bounds.key).extend({
	strokeColor: highlightColor,
	strokeWidth: 3
});
_(styles.bounds.ghost).extend({});
_(styles.bounds.hover).extend({
	strokeColor: "black",
	strokeWidth: 3
});

// Create Preview/Frame Style - Shape
styles.shape = $.extend(true, {}, styles.bounds);
_(styles.shape.default).extend({
	strokeColor: shapeStrokeColor,
});
_(styles.shape.selected).extend({});
_(styles.shape.key).extend({});
_(styles.shape.ghost).extend({});
_(styles.shape.hover).extend({});

// Create Preview/Frame Style - Shape
styles.position = $.extend(true, {}, defaultStyles);


module.exports.styles = styles;
module.exports.exportStyle = exportStyle;
module.exports.buildStyle = buildStyle;

},{"underscore":34}],48:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = Log;

////////////////////////////////////////////////////////////////////
// Log

function Log() {

	this.debugTemplate =
		_.template('<li class = "debug"><span class="message"><%= message %></span></li>');

	this.successTemplate =
		_.template('<li class = "success"><span class="message"><%= message %></span></li>');

	this.messageTemplate =
		_.template('<li class = "message"><span class="message"><%= message %></span></li>');

	this.warningTemplate =
		_.template('<li class = "warning"><span class="message"><%= message %></span></li>');

	this.errorTemplate =
		_.template('<li class = "error"><span class="message"><%= message %></span></li>');

	this.parseErrorTemplate =
		_.template('<li class = "error"><span class="line">Line <%= mark.line + 1 %></span> <span class="message"><%= reason %></span></li>');

	this.exceptionTemplate =
		_.template('<li class = "error"><span class="message"><%= message %><br />Exception occurred:  <%= e.message %></span></li>');


}

var shared;
Log.sharedInstance = function() {
	shared = shared || new Log(); 
	return shared;
};

Log.prototype.clear = function(_message) {
	$("#log").empty();
};

function stringArguments(_arguments) {
	var args = Array.prototype.slice.call(_arguments);
	return args.join(" ");
}

Log.prototype.appendDebug = function() {
	$("#log").append(this.debugTemplate({
		message: stringArguments(arguments)
	}));
	var d = $('#log');
	d.scrollTop(d.prop("scrollHeight"));

};

Log.prototype.appendSuccess = function() {
	$("#log").append(this.successTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendMessage = function() {
	$("#log").append(this.messageTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendWarning = function() {
	$("#log").append(this.warningTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendError = function() {
	$("#log").append(this.errorTemplate({
		message: stringArguments(arguments)
	}));
};

Log.prototype.appendParseError = function(_YAMLException) {
	$("#log").append(this.parseErrorTemplate(_YAMLException));
	//todo add click to this
};

Log.prototype.appendException = function(_e, _message) {

	$("#log").append(this.exceptionTemplate({e: _e, message: _message}));
	//todo add click to this
};


},{"underscore":34}],49:[function(require,module,exports){
'use strict';

var Context = require('../Context.js');
var language = require('../language.js');
var settings = require('../settings.js');

module.exports = Preview;


////////////////////////////////////////////////////////////////////
// Preview

function Preview() {
	this.previewLayer = null;
	this.buildLayer = null;
	this.exportLayer = null;

	this.doc = null;


	var self = this;
	$.Topic("UI/command/toggleViewPreview").subscribe(
		function(_state) {
			if (_state === undefined) {
				_state = !self.previewLayer.visible;
			}
			self.previewLayer.visible = _state;
			paper.view.update();
		}
	);
	$.Topic("UI/command/toggleViewBuild").subscribe(
		function(_state) {
			if (_state === undefined) {
				_state = !self.buildLayer.visible;
			}
			self.buildLayer.visible = _state;
			paper.view.update();
		}
	);
	$.Topic("UI/command/toggleViewExport").subscribe(
		function(_state) {
			if (_state === undefined) {
				_state = !self.exportLayer.visible;
			}
			self.exportLayer.visible = _state;
			paper.view.update();
		}
	);



}

Preview.prototype.init = function(_element) {
	paper.setup(_element);
	this.buildLayer = new paper.Layer();
	this.exportLayer = new paper.Layer();
	this.previewLayer = new paper.Layer();

	var drag = false;
	var lastMouse;

	// handle dragging/panning
	$(paper.view.element).mousedown(function(_e) {
		drag = true;
		lastMouse = new paper.Point(_e.originalEvent.screenX, _e.originalEvent.screenY);
	});

	$(window).mouseup(function(_e) {
		drag = false;
	});

	$(window).mousemove(function(_e) {
		if (!drag) return;
		var thisMouse = new paper.Point(_e.originalEvent.screenX, _e.originalEvent.screenY);
		paper.view.scrollBy(lastMouse.subtract(thisMouse));
		lastMouse = thisMouse;
	});

};

Preview.prototype.setDocument = function(_doc) {
	this.doc = _doc;

	var context = new Context();
	var unit = language.unitScales[this.doc.properties.unit] || 1;
	context.matrix.scale(unit);
	// module.exports.inspector.setUnit(this.doc.properties.unit);

	// draw preview/frame
	this.previewLayer.removeChildren();
	paper.project.activeLayer = this.previewLayer;
	this.doc.preview(context);

	// draw build
	this.buildLayer.removeChildren();
	paper.project.activeLayer = this.buildLayer;
	this.doc.build(context);
	this.buildLayer.style = settings.buildStyle;

	// draw export
	this.exportLayer.removeChildren();
	paper.project.activeLayer = this.exportLayer;
	this.doc.build(context);
	this.exportLayer.style = settings.exportStyle;


	paper.view.center = new paper.Point(_doc.properties.width * 0.5 * unit, _doc.properties.height * 0.5 * unit);
	paper.view.update();

};

Preview.prototype.redraw = function() {
	paper.view.update();
};

},{"../Context.js":35,"../language.js":39,"../settings.js":47}],50:[function(require,module,exports){
'use strict';
var _ = require('underscore');




module.exports.downloadDataUri = function(_filename, _data) {
	var link = document.createElement("a");
	link.download = _filename;
	link.href = _data;
	console.log(link);
	link.click();
};


// given a object tree and the name of a key that holds an array of children in each object, returns a flat array of all decendants
module.exports.collectTree = function(_node, _key) {
	var c = [_node];
	_(_node[_key]).each(
		function(_childNode) {
			c = c.concat(module.exports.collectTree(_childNode, _key));
		}
	);
	return c;
};


// given two arrays of objects, adds objects from _new to _base replacing objects with matching _key property, returns results
// does not preserve order
// [{name: abe, age: 30}, {name: beth, age: 30}] , [{name: abe, age: 31}, {name: cathy, age: 26}], "name"
// [{name: beth, age: 30}, {name: abe, age: 31}, {name: cathy, age: 26}]

module.exports.mergeObjectArraysOnKey = function(_base, _new, _key) {
	
	_base = _(_base).filter(function(_baseObject){
		var overridden = _(_new).find( function(_newObject) {
			return _newObject[_key] === _baseObject[_key];
		});
		return !overridden;
	});

	return _base.concat(_new);
}


},{"underscore":34}]},{},[37])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvZW1wdHkuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9pbmRleF9icm93c2VyLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9jb21tb24uanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9kdW1wZXIuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9leGNlcHRpb24uanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9sb2FkZXIuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9tYXJrLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hL2NvcmUuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9zY2hlbWEvZGVmYXVsdF9mdWxsLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfc2FmZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3NjaGVtYS9mYWlsc2FmZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3NjaGVtYS9qc29uLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvYmluYXJ5LmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9ib29sLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9mbG9hdC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvaW50LmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9qcy9mdW5jdGlvbi5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvanMvcmVnZXhwLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9qcy91bmRlZmluZWQuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL21hcC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvbWVyZ2UuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL251bGwuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL29tYXAuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL3BhaXJzLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9zZXEuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL3NldC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvc3RyLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS90aW1lc3RhbXAuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9ub2RlX21vZHVsZXMvZXNwcmltYS9lc3ByaW1hLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL211c3RhY2hlL211c3RhY2hlLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L0NvbnRleHQuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9QYXJzZXIuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9kb2MuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9qcXVlcnlfdXRpbC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L2xhbmd1YWdlLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvc3JjL2phdmFzY3JpcHQvcGFwZXJfdXRpbC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3JlZ2lvbi9Eb2N1bWVudC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3JlZ2lvbi9FbGxpcHNlLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvc3JjL2phdmFzY3JpcHQvcmVnaW9uL1JlY3RhbmdsZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3JlZ2lvbi9SZWdpb24uanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9yZWdpb24vUmVnaW9uR3JpZC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3JlZ2lvbi9yZWdpb25UeXBlcy5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3NldHRpbmdzLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvc3JjL2phdmFzY3JpcHQvdWkvTG9nLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvc3JjL2phdmFzY3JpcHQvdWkvUHJldmlldy5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6akRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDBIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCIndXNlIHN0cmljdCc7XG5cblxudmFyIHlhbWwgPSByZXF1aXJlKCcuL2xpYi9qcy15YW1sLmpzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB5YW1sO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuL2pzLXlhbWwvbG9hZGVyJyk7XG52YXIgZHVtcGVyID0gcmVxdWlyZSgnLi9qcy15YW1sL2R1bXBlcicpO1xuXG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZWQobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignRnVuY3Rpb24gJyArIG5hbWUgKyAnIGlzIGRlcHJlY2F0ZWQgYW5kIGNhbm5vdCBiZSB1c2VkLicpO1xuICB9O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzLlR5cGUgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL2pzLXlhbWwvdHlwZScpO1xubW9kdWxlLmV4cG9ydHMuU2NoZW1hICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vanMteWFtbC9zY2hlbWEnKTtcbm1vZHVsZS5leHBvcnRzLkZBSUxTQUZFX1NDSEVNQSAgICAgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2ZhaWxzYWZlJyk7XG5tb2R1bGUuZXhwb3J0cy5KU09OX1NDSEVNQSAgICAgICAgID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYS9qc29uJyk7XG5tb2R1bGUuZXhwb3J0cy5DT1JFX1NDSEVNQSAgICAgICAgID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYS9jb3JlJyk7XG5tb2R1bGUuZXhwb3J0cy5ERUZBVUxUX1NBRkVfU0NIRU1BID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYS9kZWZhdWx0X3NhZmUnKTtcbm1vZHVsZS5leHBvcnRzLkRFRkFVTFRfRlVMTF9TQ0hFTUEgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfZnVsbCcpO1xubW9kdWxlLmV4cG9ydHMubG9hZCAgICAgICAgICAgICAgICA9IGxvYWRlci5sb2FkO1xubW9kdWxlLmV4cG9ydHMubG9hZEFsbCAgICAgICAgICAgICA9IGxvYWRlci5sb2FkQWxsO1xubW9kdWxlLmV4cG9ydHMuc2FmZUxvYWQgICAgICAgICAgICA9IGxvYWRlci5zYWZlTG9hZDtcbm1vZHVsZS5leHBvcnRzLnNhZmVMb2FkQWxsICAgICAgICAgPSBsb2FkZXIuc2FmZUxvYWRBbGw7XG5tb2R1bGUuZXhwb3J0cy5kdW1wICAgICAgICAgICAgICAgID0gZHVtcGVyLmR1bXA7XG5tb2R1bGUuZXhwb3J0cy5zYWZlRHVtcCAgICAgICAgICAgID0gZHVtcGVyLnNhZmVEdW1wO1xubW9kdWxlLmV4cG9ydHMuWUFNTEV4Y2VwdGlvbiAgICAgICA9IHJlcXVpcmUoJy4vanMteWFtbC9leGNlcHRpb24nKTtcblxuLy8gRGVwcmVjYXJlZCBzY2hlbWEgbmFtZXMgZnJvbSBKUy1ZQU1MIDIuMC54XG5tb2R1bGUuZXhwb3J0cy5NSU5JTUFMX1NDSEVNQSA9IHJlcXVpcmUoJy4vanMteWFtbC9zY2hlbWEvZmFpbHNhZmUnKTtcbm1vZHVsZS5leHBvcnRzLlNBRkVfU0NIRU1BICAgID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYS9kZWZhdWx0X3NhZmUnKTtcbm1vZHVsZS5leHBvcnRzLkRFRkFVTFRfU0NIRU1BID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYS9kZWZhdWx0X2Z1bGwnKTtcblxuLy8gRGVwcmVjYXRlZCBmdW5jdGlvbnMgZnJvbSBKUy1ZQU1MIDEueC54XG5tb2R1bGUuZXhwb3J0cy5zY2FuICAgICAgICAgICA9IGRlcHJlY2F0ZWQoJ3NjYW4nKTtcbm1vZHVsZS5leHBvcnRzLnBhcnNlICAgICAgICAgID0gZGVwcmVjYXRlZCgncGFyc2UnKTtcbm1vZHVsZS5leHBvcnRzLmNvbXBvc2UgICAgICAgID0gZGVwcmVjYXRlZCgnY29tcG9zZScpO1xubW9kdWxlLmV4cG9ydHMuYWRkQ29uc3RydWN0b3IgPSBkZXByZWNhdGVkKCdhZGRDb25zdHJ1Y3RvcicpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbmZ1bmN0aW9uIGlzTm90aGluZyhzdWJqZWN0KSB7XG4gIHJldHVybiAodW5kZWZpbmVkID09PSBzdWJqZWN0KSB8fCAobnVsbCA9PT0gc3ViamVjdCk7XG59XG5cblxuZnVuY3Rpb24gaXNPYmplY3Qoc3ViamVjdCkge1xuICByZXR1cm4gKCdvYmplY3QnID09PSB0eXBlb2Ygc3ViamVjdCkgJiYgKG51bGwgIT09IHN1YmplY3QpO1xufVxuXG5cbmZ1bmN0aW9uIHRvQXJyYXkoc2VxdWVuY2UpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoc2VxdWVuY2UpKSB7XG4gICAgcmV0dXJuIHNlcXVlbmNlO1xuICB9IGVsc2UgaWYgKGlzTm90aGluZyhzZXF1ZW5jZSkpIHtcbiAgICByZXR1cm4gW107XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFsgc2VxdWVuY2UgXTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQsIHNvdXJjZSkge1xuICB2YXIgaW5kZXgsIGxlbmd0aCwga2V5LCBzb3VyY2VLZXlzO1xuXG4gIGlmIChzb3VyY2UpIHtcbiAgICBzb3VyY2VLZXlzID0gT2JqZWN0LmtleXMoc291cmNlKTtcblxuICAgIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBzb3VyY2VLZXlzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICAgIGtleSA9IHNvdXJjZUtleXNbaW5kZXhdO1xuICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5cbmZ1bmN0aW9uIHJlcGVhdChzdHJpbmcsIGNvdW50KSB7XG4gIHZhciByZXN1bHQgPSAnJywgY3ljbGU7XG5cbiAgZm9yIChjeWNsZSA9IDA7IGN5Y2xlIDwgY291bnQ7IGN5Y2xlICs9IDEpIHtcbiAgICByZXN1bHQgKz0gc3RyaW5nO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5pc05vdGhpbmcgID0gaXNOb3RoaW5nO1xubW9kdWxlLmV4cG9ydHMuaXNPYmplY3QgICA9IGlzT2JqZWN0O1xubW9kdWxlLmV4cG9ydHMudG9BcnJheSAgICA9IHRvQXJyYXk7XG5tb2R1bGUuZXhwb3J0cy5yZXBlYXQgICAgID0gcmVwZWF0O1xubW9kdWxlLmV4cG9ydHMuZXh0ZW5kICAgICA9IGV4dGVuZDtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgY29tbW9uICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XG52YXIgWUFNTEV4Y2VwdGlvbiAgICAgICA9IHJlcXVpcmUoJy4vZXhjZXB0aW9uJyk7XG52YXIgREVGQVVMVF9GVUxMX1NDSEVNQSA9IHJlcXVpcmUoJy4vc2NoZW1hL2RlZmF1bHRfZnVsbCcpO1xudmFyIERFRkFVTFRfU0FGRV9TQ0hFTUEgPSByZXF1aXJlKCcuL3NjaGVtYS9kZWZhdWx0X3NhZmUnKTtcblxuXG52YXIgX3RvU3RyaW5nICAgICAgID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBfaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5cbnZhciBDSEFSX1RBQiAgICAgICAgICAgICAgICAgID0gMHgwOTsgLyogVGFiICovXG52YXIgQ0hBUl9MSU5FX0ZFRUQgICAgICAgICAgICA9IDB4MEE7IC8qIExGICovXG52YXIgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gICAgICA9IDB4MEQ7IC8qIENSICovXG52YXIgQ0hBUl9TUEFDRSAgICAgICAgICAgICAgICA9IDB4MjA7IC8qIFNwYWNlICovXG52YXIgQ0hBUl9FWENMQU1BVElPTiAgICAgICAgICA9IDB4MjE7IC8qICEgKi9cbnZhciBDSEFSX0RPVUJMRV9RVU9URSAgICAgICAgID0gMHgyMjsgLyogXCIgKi9cbnZhciBDSEFSX1NIQVJQICAgICAgICAgICAgICAgID0gMHgyMzsgLyogIyAqL1xudmFyIENIQVJfUEVSQ0VOVCAgICAgICAgICAgICAgPSAweDI1OyAvKiAlICovXG52YXIgQ0hBUl9BTVBFUlNBTkQgICAgICAgICAgICA9IDB4MjY7IC8qICYgKi9cbnZhciBDSEFSX1NJTkdMRV9RVU9URSAgICAgICAgID0gMHgyNzsgLyogJyAqL1xudmFyIENIQVJfQVNURVJJU0sgICAgICAgICAgICAgPSAweDJBOyAvKiAqICovXG52YXIgQ0hBUl9DT01NQSAgICAgICAgICAgICAgICA9IDB4MkM7IC8qICwgKi9cbnZhciBDSEFSX01JTlVTICAgICAgICAgICAgICAgID0gMHgyRDsgLyogLSAqL1xudmFyIENIQVJfQ09MT04gICAgICAgICAgICAgICAgPSAweDNBOyAvKiA6ICovXG52YXIgQ0hBUl9HUkVBVEVSX1RIQU4gICAgICAgICA9IDB4M0U7IC8qID4gKi9cbnZhciBDSEFSX1FVRVNUSU9OICAgICAgICAgICAgID0gMHgzRjsgLyogPyAqL1xudmFyIENIQVJfQ09NTUVSQ0lBTF9BVCAgICAgICAgPSAweDQwOyAvKiBAICovXG52YXIgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICA9IDB4NUI7IC8qIFsgKi9cbnZhciBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUID0gMHg1RDsgLyogXSAqL1xudmFyIENIQVJfR1JBVkVfQUNDRU5UICAgICAgICAgPSAweDYwOyAvKiBgICovXG52YXIgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgICA9IDB4N0I7IC8qIHsgKi9cbnZhciBDSEFSX1ZFUlRJQ0FMX0xJTkUgICAgICAgID0gMHg3QzsgLyogfCAqL1xudmFyIENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCAgPSAweDdEOyAvKiB9ICovXG5cblxudmFyIEVTQ0FQRV9TRVFVRU5DRVMgPSB7fTtcblxuRVNDQVBFX1NFUVVFTkNFU1sweDAwXSAgID0gJ1xcXFwwJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwN10gICA9ICdcXFxcYSc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MDhdICAgPSAnXFxcXGInO1xuRVNDQVBFX1NFUVVFTkNFU1sweDA5XSAgID0gJ1xcXFx0JztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwQV0gICA9ICdcXFxcbic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MEJdICAgPSAnXFxcXHYnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDBDXSAgID0gJ1xcXFxmJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwRF0gICA9ICdcXFxccic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MUJdICAgPSAnXFxcXGUnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIyXSAgID0gJ1xcXFxcIic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4NUNdICAgPSAnXFxcXFxcXFwnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDg1XSAgID0gJ1xcXFxOJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHhBMF0gICA9ICdcXFxcXyc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MjAyOF0gPSAnXFxcXEwnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIwMjldID0gJ1xcXFxQJztcblxuXG52YXIgREVQUkVDQVRFRF9CT09MRUFOU19TWU5UQVggPSBbXG4gICd5JywgJ1knLCAneWVzJywgJ1llcycsICdZRVMnLCAnb24nLCAnT24nLCAnT04nLFxuICAnbicsICdOJywgJ25vJywgJ05vJywgJ05PJywgJ29mZicsICdPZmYnLCAnT0ZGJ1xuXTtcblxuXG5mdW5jdGlvbiBjb21waWxlU3R5bGVNYXAoc2NoZW1hLCBtYXApIHtcbiAgdmFyIHJlc3VsdCwga2V5cywgaW5kZXgsIGxlbmd0aCwgdGFnLCBzdHlsZSwgdHlwZTtcblxuICBpZiAobnVsbCA9PT0gbWFwKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgcmVzdWx0ID0ge307XG4gIGtleXMgPSBPYmplY3Qua2V5cyhtYXApO1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICB0YWcgPSBrZXlzW2luZGV4XTtcbiAgICBzdHlsZSA9IFN0cmluZyhtYXBbdGFnXSk7XG5cbiAgICBpZiAoJyEhJyA9PT0gdGFnLnNsaWNlKDAsIDIpKSB7XG4gICAgICB0YWcgPSAndGFnOnlhbWwub3JnLDIwMDI6JyArIHRhZy5zbGljZSgyKTtcbiAgICB9XG5cbiAgICB0eXBlID0gc2NoZW1hLmNvbXBpbGVkVHlwZU1hcFt0YWddO1xuXG4gICAgaWYgKHR5cGUgJiYgX2hhc093blByb3BlcnR5LmNhbGwodHlwZS5kdW1wU3R5bGVBbGlhc2VzLCBzdHlsZSkpIHtcbiAgICAgIHN0eWxlID0gdHlwZS5kdW1wU3R5bGVBbGlhc2VzW3N0eWxlXTtcbiAgICB9XG5cbiAgICByZXN1bHRbdGFnXSA9IHN0eWxlO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBlbmNvZGVIZXgoY2hhcmFjdGVyKSB7XG4gIHZhciBzdHJpbmcsIGhhbmRsZSwgbGVuZ3RoO1xuXG4gIHN0cmluZyA9IGNoYXJhY3Rlci50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcblxuICBpZiAoY2hhcmFjdGVyIDw9IDB4RkYpIHtcbiAgICBoYW5kbGUgPSAneCc7XG4gICAgbGVuZ3RoID0gMjtcbiAgfSBlbHNlIGlmIChjaGFyYWN0ZXIgPD0gMHhGRkZGKSB7XG4gICAgaGFuZGxlID0gJ3UnO1xuICAgIGxlbmd0aCA9IDQ7XG4gIH0gZWxzZSBpZiAoY2hhcmFjdGVyIDw9IDB4RkZGRkZGRkYpIHtcbiAgICBoYW5kbGUgPSAnVSc7XG4gICAgbGVuZ3RoID0gODtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignY29kZSBwb2ludCB3aXRoaW4gYSBzdHJpbmcgbWF5IG5vdCBiZSBncmVhdGVyIHRoYW4gMHhGRkZGRkZGRicpO1xuICB9XG5cbiAgcmV0dXJuICdcXFxcJyArIGhhbmRsZSArIGNvbW1vbi5yZXBlYXQoJzAnLCBsZW5ndGggLSBzdHJpbmcubGVuZ3RoKSArIHN0cmluZztcbn1cblxuXG5mdW5jdGlvbiBTdGF0ZShvcHRpb25zKSB7XG4gIHRoaXMuc2NoZW1hICAgICAgPSBvcHRpb25zWydzY2hlbWEnXSB8fCBERUZBVUxUX0ZVTExfU0NIRU1BO1xuICB0aGlzLmluZGVudCAgICAgID0gTWF0aC5tYXgoMSwgKG9wdGlvbnNbJ2luZGVudCddIHx8IDIpKTtcbiAgdGhpcy5za2lwSW52YWxpZCA9IG9wdGlvbnNbJ3NraXBJbnZhbGlkJ10gfHwgZmFsc2U7XG4gIHRoaXMuZmxvd0xldmVsICAgPSAoY29tbW9uLmlzTm90aGluZyhvcHRpb25zWydmbG93TGV2ZWwnXSkgPyAtMSA6IG9wdGlvbnNbJ2Zsb3dMZXZlbCddKTtcbiAgdGhpcy5zdHlsZU1hcCAgICA9IGNvbXBpbGVTdHlsZU1hcCh0aGlzLnNjaGVtYSwgb3B0aW9uc1snc3R5bGVzJ10gfHwgbnVsbCk7XG5cbiAgdGhpcy5pbXBsaWNpdFR5cGVzID0gdGhpcy5zY2hlbWEuY29tcGlsZWRJbXBsaWNpdDtcbiAgdGhpcy5leHBsaWNpdFR5cGVzID0gdGhpcy5zY2hlbWEuY29tcGlsZWRFeHBsaWNpdDtcblxuICB0aGlzLnRhZyA9IG51bGw7XG4gIHRoaXMucmVzdWx0ID0gJyc7XG59XG5cblxuZnVuY3Rpb24gZ2VuZXJhdGVOZXh0TGluZShzdGF0ZSwgbGV2ZWwpIHtcbiAgcmV0dXJuICdcXG4nICsgY29tbW9uLnJlcGVhdCgnICcsIHN0YXRlLmluZGVudCAqIGxldmVsKTtcbn1cblxuZnVuY3Rpb24gdGVzdEltcGxpY2l0UmVzb2x2aW5nKHN0YXRlLCBzdHIpIHtcbiAgdmFyIGluZGV4LCBsZW5ndGgsIHR5cGU7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHN0YXRlLmltcGxpY2l0VHlwZXMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHR5cGUgPSBzdGF0ZS5pbXBsaWNpdFR5cGVzW2luZGV4XTtcblxuICAgIGlmICh0eXBlLmxvYWRSZXNvbHZlciAmJiB0eXBlLmxvYWRSZXNvbHZlcih7IHJlc3VsdDogc3RyIH0pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHdyaXRlU2NhbGFyKHN0YXRlLCBvYmplY3QpIHtcbiAgdmFyIGlzUXVvdGVkLCBjaGVja3BvaW50LCBwb3NpdGlvbiwgbGVuZ3RoLCBjaGFyYWN0ZXIsIGZpcnN0O1xuXG4gIHN0YXRlLmR1bXAgPSAnJztcbiAgaXNRdW90ZWQgPSBmYWxzZTtcbiAgY2hlY2twb2ludCA9IDA7XG4gIGZpcnN0ID0gb2JqZWN0LmNoYXJDb2RlQXQoMCkgfHwgMDtcblxuICBpZiAoLTEgIT09IERFUFJFQ0FURURfQk9PTEVBTlNfU1lOVEFYLmluZGV4T2Yob2JqZWN0KSkge1xuICAgIC8vIEVuc3VyZSBjb21wYXRpYmlsaXR5IHdpdGggWUFNTCAxLjAvMS4xIGxvYWRlcnMuXG4gICAgaXNRdW90ZWQgPSB0cnVlO1xuICB9IGVsc2UgaWYgKDAgPT09IG9iamVjdC5sZW5ndGgpIHtcbiAgICAvLyBRdW90ZSBlbXB0eSBzdHJpbmdcbiAgICBpc1F1b3RlZCA9IHRydWU7XG4gIH0gZWxzZSBpZiAoQ0hBUl9TUEFDRSAgICA9PT0gZmlyc3QgfHxcbiAgICAgICAgICAgICBDSEFSX1NQQUNFICAgID09PSBvYmplY3QuY2hhckNvZGVBdChvYmplY3QubGVuZ3RoIC0gMSkpIHtcbiAgICBpc1F1b3RlZCA9IHRydWU7XG4gIH0gZWxzZSBpZiAoQ0hBUl9NSU5VUyAgICA9PT0gZmlyc3QgfHxcbiAgICAgICAgICAgICBDSEFSX1FVRVNUSU9OID09PSBmaXJzdCkge1xuICAgIC8vIERvbid0IGNoZWNrIHNlY29uZCBzeW1ib2wgZm9yIHNpbXBsaWNpdHlcbiAgICBpc1F1b3RlZCA9IHRydWU7XG4gIH1cblxuICBmb3IgKHBvc2l0aW9uID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgcG9zaXRpb24gPCBsZW5ndGg7IHBvc2l0aW9uICs9IDEpIHtcbiAgICBjaGFyYWN0ZXIgPSBvYmplY3QuY2hhckNvZGVBdChwb3NpdGlvbik7XG5cbiAgICBpZiAoIWlzUXVvdGVkKSB7XG4gICAgICBpZiAoQ0hBUl9UQUIgICAgICAgICAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgICAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9DT01NQSAgICAgICAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9TSEFSUCAgICAgICAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9BTVBFUlNBTkQgICAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9BU1RFUklTSyAgICAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9FWENMQU1BVElPTiAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9WRVJUSUNBTF9MSU5FICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9HUkVBVEVSX1RIQU4gICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9TSU5HTEVfUVVPVEUgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9ET1VCTEVfUVVPVEUgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9QRVJDRU5UICAgICAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9DT01NRVJDSUFMX0FUICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9DT0xPTiAgICAgICAgICAgICAgICA9PT0gY2hhcmFjdGVyIHx8XG4gICAgICAgICAgQ0hBUl9HUkFWRV9BQ0NFTlQgICAgICAgICA9PT0gY2hhcmFjdGVyKSB7XG4gICAgICAgIGlzUXVvdGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoRVNDQVBFX1NFUVVFTkNFU1tjaGFyYWN0ZXJdIHx8XG4gICAgICAgICEoKDB4MDAwMjAgPD0gY2hhcmFjdGVyICYmIGNoYXJhY3RlciA8PSAweDAwMDA3RSkgfHxcbiAgICAgICAgICAoMHgwMDA4NSA9PT0gY2hhcmFjdGVyKSAgICAgICAgICAgICAgICAgICAgICAgICB8fFxuICAgICAgICAgICgweDAwMEEwIDw9IGNoYXJhY3RlciAmJiBjaGFyYWN0ZXIgPD0gMHgwMEQ3RkYpIHx8XG4gICAgICAgICAgKDB4MEUwMDAgPD0gY2hhcmFjdGVyICYmIGNoYXJhY3RlciA8PSAweDAwRkZGRCkgfHxcbiAgICAgICAgICAoMHgxMDAwMCA8PSBjaGFyYWN0ZXIgJiYgY2hhcmFjdGVyIDw9IDB4MTBGRkZGKSkpIHtcbiAgICAgIHN0YXRlLmR1bXAgKz0gb2JqZWN0LnNsaWNlKGNoZWNrcG9pbnQsIHBvc2l0aW9uKTtcbiAgICAgIHN0YXRlLmR1bXAgKz0gRVNDQVBFX1NFUVVFTkNFU1tjaGFyYWN0ZXJdIHx8IGVuY29kZUhleChjaGFyYWN0ZXIpO1xuICAgICAgY2hlY2twb2ludCA9IHBvc2l0aW9uICsgMTtcbiAgICAgIGlzUXVvdGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2hlY2twb2ludCA8IHBvc2l0aW9uKSB7XG4gICAgc3RhdGUuZHVtcCArPSBvYmplY3Quc2xpY2UoY2hlY2twb2ludCwgcG9zaXRpb24pO1xuICB9XG5cbiAgaWYgKCFpc1F1b3RlZCAmJiB0ZXN0SW1wbGljaXRSZXNvbHZpbmcoc3RhdGUsIHN0YXRlLmR1bXApKSB7XG4gICAgaXNRdW90ZWQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKGlzUXVvdGVkKSB7XG4gICAgc3RhdGUuZHVtcCA9ICdcIicgKyBzdGF0ZS5kdW1wICsgJ1wiJztcbiAgfVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb3dTZXF1ZW5jZShzdGF0ZSwgbGV2ZWwsIG9iamVjdCkge1xuICB2YXIgX3Jlc3VsdCA9ICcnLFxuICAgICAgX3RhZyAgICA9IHN0YXRlLnRhZyxcbiAgICAgIGluZGV4LFxuICAgICAgbGVuZ3RoO1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIC8vIFdyaXRlIG9ubHkgdmFsaWQgZWxlbWVudHMuXG4gICAgaWYgKHdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdFtpbmRleF0sIGZhbHNlLCBmYWxzZSkpIHtcbiAgICAgIGlmICgwICE9PSBpbmRleCkge1xuICAgICAgICBfcmVzdWx0ICs9ICcsICc7XG4gICAgICB9XG4gICAgICBfcmVzdWx0ICs9IHN0YXRlLmR1bXA7XG4gICAgfVxuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9ICdbJyArIF9yZXN1bHQgKyAnXSc7XG59XG5cbmZ1bmN0aW9uIHdyaXRlQmxvY2tTZXF1ZW5jZShzdGF0ZSwgbGV2ZWwsIG9iamVjdCwgY29tcGFjdCkge1xuICB2YXIgX3Jlc3VsdCA9ICcnLFxuICAgICAgX3RhZyAgICA9IHN0YXRlLnRhZyxcbiAgICAgIGluZGV4LFxuICAgICAgbGVuZ3RoO1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIC8vIFdyaXRlIG9ubHkgdmFsaWQgZWxlbWVudHMuXG4gICAgaWYgKHdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwgKyAxLCBvYmplY3RbaW5kZXhdLCB0cnVlLCB0cnVlKSkge1xuICAgICAgaWYgKCFjb21wYWN0IHx8IDAgIT09IGluZGV4KSB7XG4gICAgICAgIF9yZXN1bHQgKz0gZ2VuZXJhdGVOZXh0TGluZShzdGF0ZSwgbGV2ZWwpO1xuICAgICAgfVxuICAgICAgX3Jlc3VsdCArPSAnLSAnICsgc3RhdGUuZHVtcDtcbiAgICB9XG4gIH1cblxuICBzdGF0ZS50YWcgPSBfdGFnO1xuICBzdGF0ZS5kdW1wID0gX3Jlc3VsdCB8fCAnW10nOyAvLyBFbXB0eSBzZXF1ZW5jZSBpZiBubyB2YWxpZCB2YWx1ZXMuXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvd01hcHBpbmcoc3RhdGUsIGxldmVsLCBvYmplY3QpIHtcbiAgdmFyIF9yZXN1bHQgICAgICAgPSAnJyxcbiAgICAgIF90YWcgICAgICAgICAgPSBzdGF0ZS50YWcsXG4gICAgICBvYmplY3RLZXlMaXN0ID0gT2JqZWN0LmtleXMob2JqZWN0KSxcbiAgICAgIGluZGV4LFxuICAgICAgbGVuZ3RoLFxuICAgICAgb2JqZWN0S2V5LFxuICAgICAgb2JqZWN0VmFsdWUsXG4gICAgICBwYWlyQnVmZmVyO1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3RLZXlMaXN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBwYWlyQnVmZmVyID0gJyc7XG5cbiAgICBpZiAoMCAhPT0gaW5kZXgpIHtcbiAgICAgIHBhaXJCdWZmZXIgKz0gJywgJztcbiAgICB9XG5cbiAgICBvYmplY3RLZXkgPSBvYmplY3RLZXlMaXN0W2luZGV4XTtcbiAgICBvYmplY3RWYWx1ZSA9IG9iamVjdFtvYmplY3RLZXldO1xuXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsLCBvYmplY3RLZXksIGZhbHNlLCBmYWxzZSkpIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoaXMgcGFpciBiZWNhdXNlIG9mIGludmFsaWQga2V5O1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5kdW1wLmxlbmd0aCA+IDEwMjQpIHtcbiAgICAgIHBhaXJCdWZmZXIgKz0gJz8gJztcbiAgICB9XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXAgKyAnOiAnO1xuXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsLCBvYmplY3RWYWx1ZSwgZmFsc2UsIGZhbHNlKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCB2YWx1ZS5cbiAgICB9XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXA7XG5cbiAgICAvLyBCb3RoIGtleSBhbmQgdmFsdWUgYXJlIHZhbGlkLlxuICAgIF9yZXN1bHQgKz0gcGFpckJ1ZmZlcjtcbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSAneycgKyBfcmVzdWx0ICsgJ30nO1xufVxuXG5mdW5jdGlvbiB3cml0ZUJsb2NrTWFwcGluZyhzdGF0ZSwgbGV2ZWwsIG9iamVjdCwgY29tcGFjdCkge1xuICB2YXIgX3Jlc3VsdCAgICAgICA9ICcnLFxuICAgICAgX3RhZyAgICAgICAgICA9IHN0YXRlLnRhZyxcbiAgICAgIG9iamVjdEtleUxpc3QgPSBPYmplY3Qua2V5cyhvYmplY3QpLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGgsXG4gICAgICBvYmplY3RLZXksXG4gICAgICBvYmplY3RWYWx1ZSxcbiAgICAgIGV4cGxpY2l0UGFpcixcbiAgICAgIHBhaXJCdWZmZXI7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdEtleUxpc3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHBhaXJCdWZmZXIgPSAnJztcblxuICAgIGlmICghY29tcGFjdCB8fCAwICE9PSBpbmRleCkge1xuICAgICAgcGFpckJ1ZmZlciArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgfVxuXG4gICAgb2JqZWN0S2V5ID0gb2JqZWN0S2V5TGlzdFtpbmRleF07XG4gICAgb2JqZWN0VmFsdWUgPSBvYmplY3Rbb2JqZWN0S2V5XTtcblxuICAgIGlmICghd3JpdGVOb2RlKHN0YXRlLCBsZXZlbCArIDEsIG9iamVjdEtleSwgdHJ1ZSwgdHJ1ZSkpIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoaXMgcGFpciBiZWNhdXNlIG9mIGludmFsaWQga2V5LlxuICAgIH1cblxuICAgIGV4cGxpY2l0UGFpciA9IChudWxsICE9PSBzdGF0ZS50YWcgJiYgJz8nICE9PSBzdGF0ZS50YWcpIHx8XG4gICAgICAgICAgICAgICAgICAgKHN0YXRlLmR1bXAgJiYgc3RhdGUuZHVtcC5sZW5ndGggPiAxMDI0KTtcblxuICAgIGlmIChleHBsaWNpdFBhaXIpIHtcbiAgICAgIGlmIChzdGF0ZS5kdW1wICYmIENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5kdW1wLmNoYXJDb2RlQXQoMCkpIHtcbiAgICAgICAgcGFpckJ1ZmZlciArPSAnPyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWlyQnVmZmVyICs9ICc/ICc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGFpckJ1ZmZlciArPSBzdGF0ZS5kdW1wO1xuXG4gICAgaWYgKGV4cGxpY2l0UGFpcikge1xuICAgICAgcGFpckJ1ZmZlciArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgfVxuXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsICsgMSwgb2JqZWN0VmFsdWUsIHRydWUsIGV4cGxpY2l0UGFpcikpIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoaXMgcGFpciBiZWNhdXNlIG9mIGludmFsaWQgdmFsdWUuXG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmR1bXAgJiYgQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmR1bXAuY2hhckNvZGVBdCgwKSkge1xuICAgICAgcGFpckJ1ZmZlciArPSAnOic7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhaXJCdWZmZXIgKz0gJzogJztcbiAgICB9XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXA7XG5cbiAgICAvLyBCb3RoIGtleSBhbmQgdmFsdWUgYXJlIHZhbGlkLlxuICAgIF9yZXN1bHQgKz0gcGFpckJ1ZmZlcjtcbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSBfcmVzdWx0IHx8ICd7fSc7IC8vIEVtcHR5IG1hcHBpbmcgaWYgbm8gdmFsaWQgcGFpcnMuXG59XG5cbmZ1bmN0aW9uIGRldGVjdFR5cGUoc3RhdGUsIG9iamVjdCwgZXhwbGljaXQpIHtcbiAgdmFyIF9yZXN1bHQsIHR5cGVMaXN0LCBpbmRleCwgbGVuZ3RoLCB0eXBlLCBzdHlsZTtcblxuICB0eXBlTGlzdCA9IGV4cGxpY2l0ID8gc3RhdGUuZXhwbGljaXRUeXBlcyA6IHN0YXRlLmltcGxpY2l0VHlwZXM7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHR5cGVMaXN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICB0eXBlID0gdHlwZUxpc3RbaW5kZXhdO1xuXG4gICAgaWYgKCh0eXBlLmR1bXBJbnN0YW5jZU9mICB8fCB0eXBlLmR1bXBQcmVkaWNhdGUpICYmXG4gICAgICAgICghdHlwZS5kdW1wSW5zdGFuY2VPZiB8fCAoKCdvYmplY3QnID09PSB0eXBlb2Ygb2JqZWN0KSAmJiAob2JqZWN0IGluc3RhbmNlb2YgdHlwZS5kdW1wSW5zdGFuY2VPZikpKSAmJlxuICAgICAgICAoIXR5cGUuZHVtcFByZWRpY2F0ZSAgfHwgdHlwZS5kdW1wUHJlZGljYXRlKG9iamVjdCkpKSB7XG5cbiAgICAgIHN0YXRlLnRhZyA9IGV4cGxpY2l0ID8gdHlwZS50YWcgOiAnPyc7XG5cbiAgICAgIGlmICh0eXBlLmR1bXBSZXByZXNlbnRlcikge1xuICAgICAgICBzdHlsZSA9IHN0YXRlLnN0eWxlTWFwW3R5cGUudGFnXSB8fCB0eXBlLmR1bXBEZWZhdWx0U3R5bGU7XG5cbiAgICAgICAgaWYgKCdbb2JqZWN0IEZ1bmN0aW9uXScgPT09IF90b1N0cmluZy5jYWxsKHR5cGUuZHVtcFJlcHJlc2VudGVyKSkge1xuICAgICAgICAgIF9yZXN1bHQgPSB0eXBlLmR1bXBSZXByZXNlbnRlcihvYmplY3QsIHN0eWxlKTtcbiAgICAgICAgfSBlbHNlIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbCh0eXBlLmR1bXBSZXByZXNlbnRlciwgc3R5bGUpKSB7XG4gICAgICAgICAgX3Jlc3VsdCA9IHR5cGUuZHVtcFJlcHJlc2VudGVyW3N0eWxlXShvYmplY3QsIHN0eWxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignITwnICsgdHlwZS50YWcgKyAnPiB0YWcgcmVzb2x2ZXIgYWNjZXB0cyBub3QgXCInICsgc3R5bGUgKyAnXCIgc3R5bGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlLmR1bXAgPSBfcmVzdWx0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIFNlcmlhbGl6ZXMgYG9iamVjdGAgYW5kIHdyaXRlcyBpdCB0byBnbG9iYWwgYHJlc3VsdGAuXG4vLyBSZXR1cm5zIHRydWUgb24gc3VjY2Vzcywgb3IgZmFsc2Ugb24gaW52YWxpZCBvYmplY3QuXG4vL1xuZnVuY3Rpb24gd3JpdGVOb2RlKHN0YXRlLCBsZXZlbCwgb2JqZWN0LCBibG9jaywgY29tcGFjdCkge1xuICBzdGF0ZS50YWcgPSBudWxsO1xuICBzdGF0ZS5kdW1wID0gb2JqZWN0O1xuXG4gIGlmICghZGV0ZWN0VHlwZShzdGF0ZSwgb2JqZWN0LCBmYWxzZSkpIHtcbiAgICBkZXRlY3RUeXBlKHN0YXRlLCBvYmplY3QsIHRydWUpO1xuICB9XG5cbiAgdmFyIHR5cGUgPSBfdG9TdHJpbmcuY2FsbChzdGF0ZS5kdW1wKTtcblxuICBpZiAoYmxvY2spIHtcbiAgICBibG9jayA9ICgwID4gc3RhdGUuZmxvd0xldmVsIHx8IHN0YXRlLmZsb3dMZXZlbCA+IGxldmVsKTtcbiAgfVxuXG4gIGlmICgobnVsbCAhPT0gc3RhdGUudGFnICYmICc/JyAhPT0gc3RhdGUudGFnKSB8fCAoMiAhPT0gc3RhdGUuaW5kZW50ICYmIGxldmVsID4gMCkpIHtcbiAgICBjb21wYWN0ID0gZmFsc2U7XG4gIH1cblxuICBpZiAoJ1tvYmplY3QgT2JqZWN0XScgPT09IHR5cGUpIHtcbiAgICBpZiAoYmxvY2sgJiYgKDAgIT09IE9iamVjdC5rZXlzKHN0YXRlLmR1bXApLmxlbmd0aCkpIHtcbiAgICAgIHdyaXRlQmxvY2tNYXBwaW5nKHN0YXRlLCBsZXZlbCwgc3RhdGUuZHVtcCwgY29tcGFjdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdyaXRlRmxvd01hcHBpbmcoc3RhdGUsIGxldmVsLCBzdGF0ZS5kdW1wKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoJ1tvYmplY3QgQXJyYXldJyA9PT0gdHlwZSkge1xuICAgIGlmIChibG9jayAmJiAoMCAhPT0gc3RhdGUuZHVtcC5sZW5ndGgpKSB7XG4gICAgICB3cml0ZUJsb2NrU2VxdWVuY2Uoc3RhdGUsIGxldmVsLCBzdGF0ZS5kdW1wLCBjb21wYWN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgd3JpdGVGbG93U2VxdWVuY2Uoc3RhdGUsIGxldmVsLCBzdGF0ZS5kdW1wKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoJ1tvYmplY3QgU3RyaW5nXScgPT09IHR5cGUpIHtcbiAgICBpZiAoJz8nICE9PSBzdGF0ZS50YWcpIHtcbiAgICAgIHdyaXRlU2NhbGFyKHN0YXRlLCBzdGF0ZS5kdW1wKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoc3RhdGUuc2tpcEludmFsaWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFlBTUxFeGNlcHRpb24oJ3VuYWNjZXB0YWJlIGtpbmQgb2YgYW4gb2JqZWN0IHRvIGR1bXAgJyArIHR5cGUpO1xuICB9XG5cbiAgaWYgKG51bGwgIT09IHN0YXRlLnRhZyAmJiAnPycgIT09IHN0YXRlLnRhZykge1xuICAgIHN0YXRlLmR1bXAgPSAnITwnICsgc3RhdGUudGFnICsgJz4gJyArIHN0YXRlLmR1bXA7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cblxuZnVuY3Rpb24gZHVtcChpbnB1dCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgc3RhdGUgPSBuZXcgU3RhdGUob3B0aW9ucyk7XG5cbiAgaWYgKHdyaXRlTm9kZShzdGF0ZSwgMCwgaW5wdXQsIHRydWUsIHRydWUpKSB7XG4gICAgcmV0dXJuIHN0YXRlLmR1bXAgKyAnXFxuJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzYWZlRHVtcChpbnB1dCwgb3B0aW9ucykge1xuICByZXR1cm4gZHVtcChpbnB1dCwgY29tbW9uLmV4dGVuZCh7IHNjaGVtYTogREVGQVVMVF9TQUZFX1NDSEVNQSB9LCBvcHRpb25zKSk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMuZHVtcCAgICAgPSBkdW1wO1xubW9kdWxlLmV4cG9ydHMuc2FmZUR1bXAgPSBzYWZlRHVtcDtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG5mdW5jdGlvbiBZQU1MRXhjZXB0aW9uKHJlYXNvbiwgbWFyaykge1xuICB0aGlzLm5hbWUgICAgPSAnWUFNTEV4Y2VwdGlvbic7XG4gIHRoaXMucmVhc29uICA9IHJlYXNvbjtcbiAgdGhpcy5tYXJrICAgID0gbWFyaztcbiAgdGhpcy5tZXNzYWdlID0gdGhpcy50b1N0cmluZyhmYWxzZSk7XG59XG5cblxuWUFNTEV4Y2VwdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyhjb21wYWN0KSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgcmVzdWx0ID0gJ0pTLVlBTUw6ICcgKyAodGhpcy5yZWFzb24gfHwgJyh1bmtub3duIHJlYXNvbiknKTtcblxuICBpZiAoIWNvbXBhY3QgJiYgdGhpcy5tYXJrKSB7XG4gICAgcmVzdWx0ICs9ICcgJyArIHRoaXMubWFyay50b1N0cmluZygpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBZQU1MRXhjZXB0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBjb21tb24gICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9jb21tb24nKTtcbnZhciBZQU1MRXhjZXB0aW9uICAgICAgID0gcmVxdWlyZSgnLi9leGNlcHRpb24nKTtcbnZhciBNYXJrICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9tYXJrJyk7XG52YXIgREVGQVVMVF9TQUZFX1NDSEVNQSA9IHJlcXVpcmUoJy4vc2NoZW1hL2RlZmF1bHRfc2FmZScpO1xudmFyIERFRkFVTFRfRlVMTF9TQ0hFTUEgPSByZXF1aXJlKCcuL3NjaGVtYS9kZWZhdWx0X2Z1bGwnKTtcblxuXG52YXIgX2hhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuXG52YXIgQ09OVEVYVF9GTE9XX0lOICAgPSAxO1xudmFyIENPTlRFWFRfRkxPV19PVVQgID0gMjtcbnZhciBDT05URVhUX0JMT0NLX0lOICA9IDM7XG52YXIgQ09OVEVYVF9CTE9DS19PVVQgPSA0O1xuXG5cbnZhciBDSE9NUElOR19DTElQICA9IDE7XG52YXIgQ0hPTVBJTkdfU1RSSVAgPSAyO1xudmFyIENIT01QSU5HX0tFRVAgID0gMztcblxuXG52YXIgQ0hBUl9UQUIgICAgICAgICAgICAgICAgICA9IDB4MDk7ICAgLyogVGFiICovXG52YXIgQ0hBUl9MSU5FX0ZFRUQgICAgICAgICAgICA9IDB4MEE7ICAgLyogTEYgKi9cbnZhciBDSEFSX0NBUlJJQUdFX1JFVFVSTiAgICAgID0gMHgwRDsgICAvKiBDUiAqL1xudmFyIENIQVJfU1BBQ0UgICAgICAgICAgICAgICAgPSAweDIwOyAgIC8qIFNwYWNlICovXG52YXIgQ0hBUl9FWENMQU1BVElPTiAgICAgICAgICA9IDB4MjE7ICAgLyogISAqL1xudmFyIENIQVJfRE9VQkxFX1FVT1RFICAgICAgICAgPSAweDIyOyAgIC8qIFwiICovXG52YXIgQ0hBUl9TSEFSUCAgICAgICAgICAgICAgICA9IDB4MjM7ICAgLyogIyAqL1xudmFyIENIQVJfUEVSQ0VOVCAgICAgICAgICAgICAgPSAweDI1OyAgIC8qICUgKi9cbnZhciBDSEFSX0FNUEVSU0FORCAgICAgICAgICAgID0gMHgyNjsgICAvKiAmICovXG52YXIgQ0hBUl9TSU5HTEVfUVVPVEUgICAgICAgICA9IDB4Mjc7ICAgLyogJyAqL1xudmFyIENIQVJfQVNURVJJU0sgICAgICAgICAgICAgPSAweDJBOyAgIC8qICogKi9cbnZhciBDSEFSX1BMVVMgICAgICAgICAgICAgICAgID0gMHgyQjsgICAvKiArICovXG52YXIgQ0hBUl9DT01NQSAgICAgICAgICAgICAgICA9IDB4MkM7ICAgLyogLCAqL1xudmFyIENIQVJfTUlOVVMgICAgICAgICAgICAgICAgPSAweDJEOyAgIC8qIC0gKi9cbnZhciBDSEFSX0RPVCAgICAgICAgICAgICAgICAgID0gMHgyRTsgICAvKiAuICovXG52YXIgQ0hBUl9TTEFTSCAgICAgICAgICAgICAgICA9IDB4MkY7ICAgLyogLyAqL1xudmFyIENIQVJfRElHSVRfWkVSTyAgICAgICAgICAgPSAweDMwOyAgIC8qIDAgKi9cbnZhciBDSEFSX0RJR0lUX09ORSAgICAgICAgICAgID0gMHgzMTsgICAvKiAxICovXG52YXIgQ0hBUl9ESUdJVF9OSU5FICAgICAgICAgICA9IDB4Mzk7ICAgLyogOSAqL1xudmFyIENIQVJfQ09MT04gICAgICAgICAgICAgICAgPSAweDNBOyAgIC8qIDogKi9cbnZhciBDSEFSX0xFU1NfVEhBTiAgICAgICAgICAgID0gMHgzQzsgICAvKiA8ICovXG52YXIgQ0hBUl9HUkVBVEVSX1RIQU4gICAgICAgICA9IDB4M0U7ICAgLyogPiAqL1xudmFyIENIQVJfUVVFU1RJT04gICAgICAgICAgICAgPSAweDNGOyAgIC8qID8gKi9cbnZhciBDSEFSX0NPTU1FUkNJQUxfQVQgICAgICAgID0gMHg0MDsgICAvKiBAICovXG52YXIgQ0hBUl9DQVBJVEFMX0EgICAgICAgICAgICA9IDB4NDE7ICAgLyogQSAqL1xudmFyIENIQVJfQ0FQSVRBTF9GICAgICAgICAgICAgPSAweDQ2OyAgIC8qIEYgKi9cbnZhciBDSEFSX0NBUElUQUxfTCAgICAgICAgICAgID0gMHg0QzsgICAvKiBMICovXG52YXIgQ0hBUl9DQVBJVEFMX04gICAgICAgICAgICA9IDB4NEU7ICAgLyogTiAqL1xudmFyIENIQVJfQ0FQSVRBTF9QICAgICAgICAgICAgPSAweDUwOyAgIC8qIFAgKi9cbnZhciBDSEFSX0NBUElUQUxfVSAgICAgICAgICAgID0gMHg1NTsgICAvKiBVICovXG52YXIgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICA9IDB4NUI7ICAgLyogWyAqL1xudmFyIENIQVJfQkFDS1NMQVNIICAgICAgICAgICAgPSAweDVDOyAgIC8qIFxcICovXG52YXIgQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCA9IDB4NUQ7ICAgLyogXSAqL1xudmFyIENIQVJfVU5ERVJTQ09SRSAgICAgICAgICAgPSAweDVGOyAgIC8qIF8gKi9cbnZhciBDSEFSX0dSQVZFX0FDQ0VOVCAgICAgICAgID0gMHg2MDsgICAvKiBgICovXG52YXIgQ0hBUl9TTUFMTF9BICAgICAgICAgICAgICA9IDB4NjE7ICAgLyogYSAqL1xudmFyIENIQVJfU01BTExfQiAgICAgICAgICAgICAgPSAweDYyOyAgIC8qIGIgKi9cbnZhciBDSEFSX1NNQUxMX0UgICAgICAgICAgICAgID0gMHg2NTsgICAvKiBlICovXG52YXIgQ0hBUl9TTUFMTF9GICAgICAgICAgICAgICA9IDB4NjY7ICAgLyogZiAqL1xudmFyIENIQVJfU01BTExfTiAgICAgICAgICAgICAgPSAweDZFOyAgIC8qIG4gKi9cbnZhciBDSEFSX1NNQUxMX1IgICAgICAgICAgICAgID0gMHg3MjsgICAvKiByICovXG52YXIgQ0hBUl9TTUFMTF9UICAgICAgICAgICAgICA9IDB4NzQ7ICAgLyogdCAqL1xudmFyIENIQVJfU01BTExfVSAgICAgICAgICAgICAgPSAweDc1OyAgIC8qIHUgKi9cbnZhciBDSEFSX1NNQUxMX1YgICAgICAgICAgICAgID0gMHg3NjsgICAvKiB2ICovXG52YXIgQ0hBUl9TTUFMTF9YICAgICAgICAgICAgICA9IDB4Nzg7ICAgLyogeCAqL1xudmFyIENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUICAgPSAweDdCOyAgIC8qIHsgKi9cbnZhciBDSEFSX1ZFUlRJQ0FMX0xJTkUgICAgICAgID0gMHg3QzsgICAvKiB8ICovXG52YXIgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICA9IDB4N0Q7ICAgLyogfSAqL1xuXG5cbnZhciBTSU1QTEVfRVNDQVBFX1NFUVVFTkNFUyA9IHt9O1xuXG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX0RJR0lUX1pFUk9dICAgPSAnXFx4MDAnO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TTUFMTF9BXSAgICAgID0gJ1xceDA3JztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU01BTExfQl0gICAgICA9ICdcXHgwOCc7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX1NNQUxMX1RdICAgICAgPSAnXFx4MDknO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9UQUJdICAgICAgICAgID0gJ1xceDA5JztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU01BTExfTl0gICAgICA9ICdcXHgwQSc7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX1NNQUxMX1ZdICAgICAgPSAnXFx4MEInO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TTUFMTF9GXSAgICAgID0gJ1xceDBDJztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU01BTExfUl0gICAgICA9ICdcXHgwRCc7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX1NNQUxMX0VdICAgICAgPSAnXFx4MUInO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TUEFDRV0gICAgICAgID0gJyAnO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9ET1VCTEVfUVVPVEVdID0gJ1xceDIyJztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU0xBU0hdICAgICAgICA9ICcvJztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfQkFDS1NMQVNIXSAgICA9ICdcXHg1Qyc7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX0NBUElUQUxfTl0gICAgPSAnXFx4ODUnO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9VTkRFUlNDT1JFXSAgID0gJ1xceEEwJztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfQ0FQSVRBTF9MXSAgICA9ICdcXHUyMDI4JztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfQ0FQSVRBTF9QXSAgICA9ICdcXHUyMDI5JztcblxuXG52YXIgSEVYQURFQ0lNQUxfRVNDQVBFX1NFUVVFTkNFUyA9IHt9O1xuXG5IRVhBREVDSU1BTF9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU01BTExfWF0gICA9IDI7XG5IRVhBREVDSU1BTF9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU01BTExfVV0gICA9IDQ7XG5IRVhBREVDSU1BTF9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfQ0FQSVRBTF9VXSA9IDg7XG5cblxudmFyIFBBVFRFUk5fTk9OX1BSSU5UQUJMRSAgICAgICAgID0gL1tcXHgwMC1cXHgwOFxceDBCXFx4MENcXHgwRS1cXHgxRlxceDdGLVxceDg0XFx4ODYtXFx4OUZcXHVEODAwLVxcdURGRkZcXHVGRkZFXFx1RkZGRl0vO1xudmFyIFBBVFRFUk5fTk9OX0FTQ0lJX0xJTkVfQlJFQUtTID0gL1tcXHg4NVxcdTIwMjhcXHUyMDI5XS87XG52YXIgUEFUVEVSTl9GTE9XX0lORElDQVRPUlMgICAgICAgPSAvWyxcXFtcXF1cXHtcXH1dLztcbnZhciBQQVRURVJOX1RBR19IQU5ETEUgICAgICAgICAgICA9IC9eKD86IXwhIXwhW2EtelxcLV0rISkkL2k7XG52YXIgUEFUVEVSTl9UQUdfVVJJICAgICAgICAgICAgICAgPSAvXig/OiF8W14sXFxbXFxdXFx7XFx9XSkoPzolWzAtOWEtZl17Mn18WzAtOWEtelxcLSM7XFwvXFw/OkAmPVxcK1xcJCxfXFwuIX5cXConXFwoXFwpXFxbXFxdXSkqJC9pO1xuXG5cbmZ1bmN0aW9uIFN0YXRlKGlucHV0LCBvcHRpb25zKSB7XG4gIHRoaXMuaW5wdXQgICAgPSBpbnB1dDtcblxuICB0aGlzLmZpbGVuYW1lID0gb3B0aW9uc1snZmlsZW5hbWUnXSB8fCBudWxsO1xuICB0aGlzLnNjaGVtYSAgID0gb3B0aW9uc1snc2NoZW1hJ10gICB8fCBERUZBVUxUX0ZVTExfU0NIRU1BO1xuICB0aGlzLnN0cmljdCAgID0gb3B0aW9uc1snc3RyaWN0J10gICB8fCBmYWxzZTtcbiAgdGhpcy5sZWdhY3kgICA9IG9wdGlvbnNbJ2xlZ2FjeSddICAgfHwgZmFsc2U7XG5cbiAgdGhpcy5pbXBsaWNpdFR5cGVzICAgICA9IHRoaXMuc2NoZW1hLmNvbXBpbGVkSW1wbGljaXQ7XG4gIHRoaXMudHlwZU1hcCAgICAgICAgICAgPSB0aGlzLnNjaGVtYS5jb21waWxlZFR5cGVNYXA7XG5cbiAgdGhpcy5sZW5ndGggICAgID0gaW5wdXQubGVuZ3RoO1xuICB0aGlzLnBvc2l0aW9uICAgPSAwO1xuICB0aGlzLmxpbmUgICAgICAgPSAwO1xuICB0aGlzLmxpbmVTdGFydCAgPSAwO1xuICB0aGlzLmxpbmVJbmRlbnQgPSAwO1xuICB0aGlzLmNoYXJhY3RlciAgPSBpbnB1dC5jaGFyQ29kZUF0KDAgLypwb3NpdGlvbiovKTtcblxuICAvKlxuICB0aGlzLnZlcnNpb247XG4gIHRoaXMuY2hlY2tMaW5lQnJlYWtzO1xuICB0aGlzLnRhZ01hcDtcbiAgdGhpcy5hbmNob3JNYXA7XG4gIHRoaXMudGFnO1xuICB0aGlzLmFuY2hvcjtcbiAgdGhpcy5raW5kO1xuICB0aGlzLnJlc3VsdDsqL1xuXG59XG5cblxuZnVuY3Rpb24gZ2VuZXJhdGVFcnJvcihzdGF0ZSwgbWVzc2FnZSkge1xuICByZXR1cm4gbmV3IFlBTUxFeGNlcHRpb24oXG4gICAgbWVzc2FnZSxcbiAgICBuZXcgTWFyayhzdGF0ZS5maWxlbmFtZSwgc3RhdGUuaW5wdXQsIHN0YXRlLnBvc2l0aW9uLCBzdGF0ZS5saW5lLCAoc3RhdGUucG9zaXRpb24gLSBzdGF0ZS5saW5lU3RhcnQpKSk7XG59XG5cbmZ1bmN0aW9uIHRocm93RXJyb3Ioc3RhdGUsIG1lc3NhZ2UpIHtcbiAgdGhyb3cgZ2VuZXJhdGVFcnJvcihzdGF0ZSwgbWVzc2FnZSk7XG59XG5cbmZ1bmN0aW9uIHRocm93V2FybmluZyhzdGF0ZSwgbWVzc2FnZSkge1xuICB2YXIgZXJyb3IgPSBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKTtcblxuICBpZiAoc3RhdGUuc3RyaWN0KSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS53YXJuKGVycm9yLnRvU3RyaW5nKCkpO1xuICB9XG59XG5cblxudmFyIGRpcmVjdGl2ZUhhbmRsZXJzID0ge1xuXG4gICdZQU1MJzogZnVuY3Rpb24gaGFuZGxlWWFtbERpcmVjdGl2ZShzdGF0ZSwgbmFtZSwgYXJncykge1xuXG4gICAgICB2YXIgbWF0Y2gsIG1ham9yLCBtaW5vcjtcblxuICAgICAgaWYgKG51bGwgIT09IHN0YXRlLnZlcnNpb24pIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2R1cGxpY2F0aW9uIG9mICVZQU1MIGRpcmVjdGl2ZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAoMSAhPT0gYXJncy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ1lBTUwgZGlyZWN0aXZlIGFjY2VwdHMgZXhhY3RseSBvbmUgYXJndW1lbnQnKTtcbiAgICAgIH1cblxuICAgICAgbWF0Y2ggPSAvXihbMC05XSspXFwuKFswLTldKykkLy5leGVjKGFyZ3NbMF0pO1xuXG4gICAgICBpZiAobnVsbCA9PT0gbWF0Y2gpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2lsbC1mb3JtZWQgYXJndW1lbnQgb2YgdGhlIFlBTUwgZGlyZWN0aXZlJyk7XG4gICAgICB9XG5cbiAgICAgIG1ham9yID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgIG1pbm9yID0gcGFyc2VJbnQobWF0Y2hbMl0sIDEwKTtcblxuICAgICAgaWYgKDEgIT09IG1ham9yKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmFjY2VwdGFibGUgWUFNTCB2ZXJzaW9uIG9mIHRoZSBkb2N1bWVudCcpO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS52ZXJzaW9uID0gYXJnc1swXTtcbiAgICAgIHN0YXRlLmNoZWNrTGluZUJyZWFrcyA9IChtaW5vciA8IDIpO1xuXG4gICAgICBpZiAoMSAhPT0gbWlub3IgJiYgMiAhPT0gbWlub3IpIHtcbiAgICAgICAgdGhyb3dXYXJuaW5nKHN0YXRlLCAndW5zdXBwb3J0ZWQgWUFNTCB2ZXJzaW9uIG9mIHRoZSBkb2N1bWVudCcpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgJ1RBRyc6IGZ1bmN0aW9uIGhhbmRsZVRhZ0RpcmVjdGl2ZShzdGF0ZSwgbmFtZSwgYXJncykge1xuXG4gICAgICB2YXIgaGFuZGxlLCBwcmVmaXg7XG5cbiAgICAgIGlmICgyICE9PSBhcmdzLmxlbmd0aCkge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnVEFHIGRpcmVjdGl2ZSBhY2NlcHRzIGV4YWN0bHkgdHdvIGFyZ3VtZW50cycpO1xuICAgICAgfVxuXG4gICAgICBoYW5kbGUgPSBhcmdzWzBdO1xuICAgICAgcHJlZml4ID0gYXJnc1sxXTtcblxuICAgICAgaWYgKCFQQVRURVJOX1RBR19IQU5ETEUudGVzdChoYW5kbGUpKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdpbGwtZm9ybWVkIHRhZyBoYW5kbGUgKGZpcnN0IGFyZ3VtZW50KSBvZiB0aGUgVEFHIGRpcmVjdGl2ZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAoX2hhc093blByb3BlcnR5LmNhbGwoc3RhdGUudGFnTWFwLCBoYW5kbGUpKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd0aGVyZSBpcyBhIHByZXZpb3VzbHkgZGVjbGFyZWQgc3VmZml4IGZvciBcIicgKyBoYW5kbGUgKyAnXCIgdGFnIGhhbmRsZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIVBBVFRFUk5fVEFHX1VSSS50ZXN0KHByZWZpeCkpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2lsbC1mb3JtZWQgdGFnIHByZWZpeCAoc2Vjb25kIGFyZ3VtZW50KSBvZiB0aGUgVEFHIGRpcmVjdGl2ZScpO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS50YWdNYXBbaGFuZGxlXSA9IHByZWZpeDtcbiAgICB9XG59O1xuXG5cbmZ1bmN0aW9uIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBzdGFydCwgZW5kLCBjaGVja0pzb24pIHtcbiAgdmFyIF9wb3NpdGlvbiwgX2xlbmd0aCwgX2NoYXJhY3RlciwgX3Jlc3VsdDtcblxuICBpZiAoc3RhcnQgPCBlbmQpIHtcbiAgICBfcmVzdWx0ID0gc3RhdGUuaW5wdXQuc2xpY2Uoc3RhcnQsIGVuZCk7XG5cbiAgICBpZiAoY2hlY2tKc29uKSB7XG4gICAgICBmb3IgKF9wb3NpdGlvbiA9IDAsIF9sZW5ndGggPSBfcmVzdWx0Lmxlbmd0aDtcbiAgICAgICAgICAgX3Bvc2l0aW9uIDwgX2xlbmd0aDtcbiAgICAgICAgICAgX3Bvc2l0aW9uICs9IDEpIHtcbiAgICAgICAgX2NoYXJhY3RlciA9IF9yZXN1bHQuY2hhckNvZGVBdChfcG9zaXRpb24pO1xuICAgICAgICBpZiAoISgweDA5ID09PSBfY2hhcmFjdGVyIHx8XG4gICAgICAgICAgICAgIDB4MjAgPD0gX2NoYXJhY3RlciAmJiBfY2hhcmFjdGVyIDw9IDB4MTBGRkZGKSkge1xuICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdleHBlY3RlZCB2YWxpZCBKU09OIGNoYXJhY3RlcicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGUucmVzdWx0ICs9IF9yZXN1bHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWVyZ2VNYXBwaW5ncyhzdGF0ZSwgZGVzdGluYXRpb24sIHNvdXJjZSkge1xuICB2YXIgc291cmNlS2V5cywga2V5LCBpbmRleCwgcXVhbnRpdHk7XG5cbiAgaWYgKCFjb21tb24uaXNPYmplY3Qoc291cmNlKSkge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdjYW5ub3QgbWVyZ2UgbWFwcGluZ3M7IHRoZSBwcm92aWRlZCBzb3VyY2Ugb2JqZWN0IGlzIHVuYWNjZXB0YWJsZScpO1xuICB9XG5cbiAgc291cmNlS2V5cyA9IE9iamVjdC5rZXlzKHNvdXJjZSk7XG5cbiAgZm9yIChpbmRleCA9IDAsIHF1YW50aXR5ID0gc291cmNlS2V5cy5sZW5ndGg7IGluZGV4IDwgcXVhbnRpdHk7IGluZGV4ICs9IDEpIHtcbiAgICBrZXkgPSBzb3VyY2VLZXlzW2luZGV4XTtcblxuICAgIGlmICghX2hhc093blByb3BlcnR5LmNhbGwoZGVzdGluYXRpb24sIGtleSkpIHtcbiAgICAgIGRlc3RpbmF0aW9uW2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgX3Jlc3VsdCwga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUpIHtcbiAgdmFyIGluZGV4LCBxdWFudGl0eTtcblxuICBrZXlOb2RlID0gU3RyaW5nKGtleU5vZGUpO1xuXG4gIGlmIChudWxsID09PSBfcmVzdWx0KSB7XG4gICAgX3Jlc3VsdCA9IHt9O1xuICB9XG5cbiAgaWYgKCd0YWc6eWFtbC5vcmcsMjAwMjptZXJnZScgPT09IGtleVRhZykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlTm9kZSkpIHtcbiAgICAgIGZvciAoaW5kZXggPSAwLCBxdWFudGl0eSA9IHZhbHVlTm9kZS5sZW5ndGg7IGluZGV4IDwgcXVhbnRpdHk7IGluZGV4ICs9IDEpIHtcbiAgICAgICAgbWVyZ2VNYXBwaW5ncyhzdGF0ZSwgX3Jlc3VsdCwgdmFsdWVOb2RlW2luZGV4XSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG1lcmdlTWFwcGluZ3Moc3RhdGUsIF9yZXN1bHQsIHZhbHVlTm9kZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIF9yZXN1bHRba2V5Tm9kZV0gPSB2YWx1ZU5vZGU7XG4gIH1cblxuICByZXR1cm4gX3Jlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmVhZExpbmVCcmVhayhzdGF0ZSkge1xuICBpZiAoQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHN0YXRlLnBvc2l0aW9uICs9IDE7XG4gIH0gZWxzZSBpZiAoQ0hBUl9DQVJSSUFHRV9SRVRVUk4gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIGlmIChDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpKSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbiArPSAyO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbiArPSAxO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnYSBsaW5lIGJyZWFrIGlzIGV4cGVjdGVkJyk7XG4gIH1cblxuICBzdGF0ZS5saW5lICs9IDE7XG4gIHN0YXRlLmxpbmVTdGFydCA9IHN0YXRlLnBvc2l0aW9uO1xuICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcbn1cblxuZnVuY3Rpb24gc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgYWxsb3dDb21tZW50cywgY2hlY2tJbmRlbnQpIHtcbiAgdmFyIGxpbmVCcmVha3MgPSAwO1xuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgIHdoaWxlIChDSEFSX1NQQUNFID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9UQUIgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAoYWxsb3dDb21tZW50cyAmJiBDSEFSX1NIQVJQID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGRvIHsgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTsgfVxuICAgICAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoICYmXG4gICAgICAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICE9PSBzdGF0ZS5jaGFyYWN0ZXIpO1xuICAgIH1cblxuICAgIGlmIChDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8IENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIHJlYWRMaW5lQnJlYWsoc3RhdGUpO1xuICAgICAgbGluZUJyZWFrcyArPSAxO1xuICAgICAgc3RhdGUubGluZUluZGVudCA9IDA7XG5cbiAgICAgIHdoaWxlIChDSEFSX1NQQUNFID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgc3RhdGUubGluZUluZGVudCArPSAxO1xuICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3RhdGUubGluZUluZGVudCA8IGNoZWNrSW5kZW50KSB7XG4gICAgICAgIHRocm93V2FybmluZyhzdGF0ZSwgJ2RlZmljaWVudCBpbmRlbnRhdGlvbicpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGluZUJyZWFrcztcbn1cblxuZnVuY3Rpb24gdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSB7XG4gIHZhciBfcG9zaXRpb24sIF9jaGFyYWN0ZXI7XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiZcbiAgICAgIChDSEFSX01JTlVTID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9ET1QgPT09IHN0YXRlLmNoYXJhY3RlcikgJiZcbiAgICAgIHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKSA9PT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMikgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuXG4gICAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb24gKyAzO1xuICAgIF9jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KF9wb3NpdGlvbik7XG5cbiAgICBpZiAoX3Bvc2l0aW9uID49IHN0YXRlLmxlbmd0aCB8fFxuICAgICAgICBDSEFSX1NQQUNFICAgICAgICAgICA9PT0gX2NoYXJhY3RlciB8fFxuICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICA9PT0gX2NoYXJhY3RlciB8fFxuICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICA9PT0gX2NoYXJhY3RlciB8fFxuICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiA9PT0gX2NoYXJhY3Rlcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiB3cml0ZUZvbGRlZExpbmVzKHN0YXRlLCBjb3VudCkge1xuICBpZiAoMSA9PT0gY291bnQpIHtcbiAgICBzdGF0ZS5yZXN1bHQgKz0gJyAnO1xuICB9IGVsc2UgaWYgKGNvdW50ID4gMSkge1xuICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBjb3VudCAtIDEpO1xuICB9XG59XG5cblxuZnVuY3Rpb24gcmVhZFBsYWluU2NhbGFyKHN0YXRlLCBub2RlSW5kZW50LCB3aXRoaW5GbG93Q29sbGVjdGlvbikge1xuICB2YXIgcHJlY2VkaW5nLFxuICAgICAgZm9sbG93aW5nLFxuICAgICAgY2FwdHVyZVN0YXJ0LFxuICAgICAgY2FwdHVyZUVuZCxcbiAgICAgIGhhc1BlbmRpbmdDb250ZW50LFxuICAgICAgX2xpbmUsXG4gICAgICBfbGluZVN0YXJ0LFxuICAgICAgX2xpbmVJbmRlbnQsXG4gICAgICBfa2luZCA9IHN0YXRlLmtpbmQsXG4gICAgICBfcmVzdWx0ID0gc3RhdGUucmVzdWx0O1xuXG4gIGlmIChDSEFSX1NQQUNFICAgICAgICAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfVEFCICAgICAgICAgICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9MSU5FX0ZFRUQgICAgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfQ09NTUEgICAgICAgICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX1NIQVJQICAgICAgICAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfQU1QRVJTQU5EICAgICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9BU1RFUklTSyAgICAgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX0VYQ0xBTUFUSU9OICAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfVkVSVElDQUxfTElORSAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9HUkVBVEVSX1RIQU4gICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX1NJTkdMRV9RVU9URSAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfRE9VQkxFX1FVT1RFICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9QRVJDRU5UICAgICAgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX0NPTU1FUkNJQUxfQVQgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfR1JBVkVfQUNDRU5UICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChDSEFSX1FVRVNUSU9OID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfTUlOVVMgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgIGlmIChDSEFSX1NQQUNFICAgICAgICAgICAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgIENIQVJfVEFCICAgICAgICAgICAgICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgICAgICAgICAgICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgIHdpdGhpbkZsb3dDb2xsZWN0aW9uICYmXG4gICAgICAgIChDSEFSX0NPTU1BICAgICAgICAgICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgIENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVCAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgIENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCAgPT09IGZvbGxvd2luZykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBzdGF0ZS5raW5kID0gJ3NjYWxhcic7XG4gIHN0YXRlLnJlc3VsdCA9ICcnO1xuICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG4gIGhhc1BlbmRpbmdDb250ZW50ID0gZmFsc2U7XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgaWYgKENIQVJfQ09MT04gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgZm9sbG93aW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgICBpZiAoQ0hBUl9TUEFDRSAgICAgICAgICAgICAgICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgIENIQVJfVEFCICAgICAgICAgICAgICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gICAgICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgIHdpdGhpbkZsb3dDb2xsZWN0aW9uICYmXG4gICAgICAgICAgKENIQVJfQ09NTUEgICAgICAgICAgICAgICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgICBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgICAgQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICAgIENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgICBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQgID09PSBmb2xsb3dpbmcpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChDSEFSX1NIQVJQID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIHByZWNlZGluZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gLSAxKTtcblxuICAgICAgaWYgKENIQVJfU1BBQ0UgICAgICAgICAgID09PSBwcmVjZWRpbmcgfHxcbiAgICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICA9PT0gcHJlY2VkaW5nIHx8XG4gICAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgICAgICAgPT09IHByZWNlZGluZyB8fFxuICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBwcmVjZWRpbmcpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKChzdGF0ZS5wb3NpdGlvbiA9PT0gc3RhdGUubGluZVN0YXJ0ICYmIHRlc3REb2N1bWVudFNlcGFyYXRvcihzdGF0ZSkpIHx8XG4gICAgICAgICAgICAgICB3aXRoaW5GbG93Q29sbGVjdGlvbiAmJlxuICAgICAgICAgICAgICAgKENIQVJfQ09NTUEgICAgICAgICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgICAgICAgICAgIENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVCAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgICAgICAgICAgIENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVQgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgICAgICAgICAgIENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgICAgICAgICAgIENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCAgPT09IHN0YXRlLmNoYXJhY3RlcikpIHtcbiAgICAgIGJyZWFrO1xuXG4gICAgfSBlbHNlIGlmIChDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICAgICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBfbGluZSA9IHN0YXRlLmxpbmU7XG4gICAgICBfbGluZVN0YXJ0ID0gc3RhdGUubGluZVN0YXJ0O1xuICAgICAgX2xpbmVJbmRlbnQgPSBzdGF0ZS5saW5lSW5kZW50O1xuICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgZmFsc2UsIC0xKTtcblxuICAgICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPj0gbm9kZUluZGVudCkge1xuICAgICAgICBoYXNQZW5kaW5nQ29udGVudCA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucG9zaXRpb24gPSBjYXB0dXJlRW5kO1xuICAgICAgICBzdGF0ZS5saW5lID0gX2xpbmU7XG4gICAgICAgIHN0YXRlLmxpbmVTdGFydCA9IF9saW5lU3RhcnQ7XG4gICAgICAgIHN0YXRlLmxpbmVJbmRlbnQgPSBfbGluZUluZGVudDtcbiAgICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChoYXNQZW5kaW5nQ29udGVudCkge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgY2FwdHVyZUVuZCwgZmFsc2UpO1xuICAgICAgd3JpdGVGb2xkZWRMaW5lcyhzdGF0ZSwgc3RhdGUubGluZSAtIF9saW5lKTtcbiAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICAgIGhhc1BlbmRpbmdDb250ZW50ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKENIQVJfU1BBQ0UgIT09IHN0YXRlLmNoYXJhY3RlciAmJiBDSEFSX1RBQiAhPT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb24gKyAxO1xuICAgIH1cblxuICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIH1cblxuICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kLCBmYWxzZSk7XG5cbiAgaWYgKHN0YXRlLnJlc3VsdCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHN0YXRlLmtpbmQgPSBfa2luZDtcbiAgICBzdGF0ZS5yZXN1bHQgPSBfcmVzdWx0O1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkU2luZ2xlUXVvdGVkU2NhbGFyKHN0YXRlLCBub2RlSW5kZW50KSB7XG4gIHZhciBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQ7XG5cbiAgaWYgKENIQVJfU0lOR0xFX1FVT1RFICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0ZS5raW5kID0gJ3NjYWxhcic7XG4gIHN0YXRlLnJlc3VsdCA9ICcnO1xuICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgaWYgKENIQVJfU0lOR0xFX1FVT1RFID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIHN0YXRlLnBvc2l0aW9uLCB0cnVlKTtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICAgIGlmIChDSEFSX1NJTkdMRV9RVU9URSA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICAgICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kLCB0cnVlKTtcbiAgICAgIHdyaXRlRm9sZGVkTGluZXMoc3RhdGUsIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIGZhbHNlLCBub2RlSW5kZW50KSk7XG4gICAgICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICAgIH0gZWxzZSBpZiAoc3RhdGUucG9zaXRpb24gPT09IHN0YXRlLmxpbmVTdGFydCAmJiB0ZXN0RG9jdW1lbnRTZXBhcmF0b3Ioc3RhdGUpKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5leHBlY3RlZCBlbmQgb2YgdGhlIGRvY3VtZW50IHdpdGhpbiBhIHNpbmdsZSBxdW90ZWQgc2NhbGFyJyk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICB9XG4gIH1cblxuICB0aHJvd0Vycm9yKHN0YXRlLCAndW5leHBlY3RlZCBlbmQgb2YgdGhlIHN0cmVhbSB3aXRoaW4gYSBzaW5nbGUgcXVvdGVkIHNjYWxhcicpO1xufVxuXG5mdW5jdGlvbiByZWFkRG91YmxlUXVvdGVkU2NhbGFyKHN0YXRlLCBub2RlSW5kZW50KSB7XG4gIHZhciBjYXB0dXJlU3RhcnQsXG4gICAgICBjYXB0dXJlRW5kLFxuICAgICAgaGV4TGVuZ3RoLFxuICAgICAgaGV4SW5kZXgsXG4gICAgICBoZXhPZmZzZXQsXG4gICAgICBoZXhSZXN1bHQ7XG5cbiAgaWYgKENIQVJfRE9VQkxFX1FVT1RFICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0ZS5raW5kID0gJ3NjYWxhcic7XG4gIHN0YXRlLnJlc3VsdCA9ICcnO1xuICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgaWYgKENIQVJfRE9VQkxFX1FVT1RFID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIHN0YXRlLnBvc2l0aW9uLCB0cnVlKTtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIH0gZWxzZSBpZiAoQ0hBUl9CQUNLU0xBU0ggPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgc3RhdGUucG9zaXRpb24sIHRydWUpO1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgaWYgKENIQVJfTElORV9GRUVEICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIGZhbHNlLCBub2RlSW5kZW50KTtcblxuICAgICAgfSBlbHNlIGlmIChTSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tzdGF0ZS5jaGFyYWN0ZXJdKSB7XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBTSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tzdGF0ZS5jaGFyYWN0ZXJdO1xuICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICB9IGVsc2UgaWYgKEhFWEFERUNJTUFMX0VTQ0FQRV9TRVFVRU5DRVNbc3RhdGUuY2hhcmFjdGVyXSkge1xuICAgICAgICBoZXhMZW5ndGggPSBIRVhBREVDSU1BTF9FU0NBUEVfU0VRVUVOQ0VTW3N0YXRlLmNoYXJhY3Rlcl07XG4gICAgICAgIGhleFJlc3VsdCA9IDA7XG5cbiAgICAgICAgZm9yIChoZXhJbmRleCA9IDE7IGhleEluZGV4IDw9IGhleExlbmd0aDsgaGV4SW5kZXggKz0gMSkge1xuICAgICAgICAgIGhleE9mZnNldCA9IChoZXhMZW5ndGggLSBoZXhJbmRleCkgKiA0O1xuICAgICAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICAgICAgICBpZiAoQ0hBUl9ESUdJVF9aRVJPIDw9IHN0YXRlLmNoYXJhY3RlciAmJiBzdGF0ZS5jaGFyYWN0ZXIgPD0gQ0hBUl9ESUdJVF9OSU5FKSB7XG4gICAgICAgICAgICBoZXhSZXN1bHQgfD0gKHN0YXRlLmNoYXJhY3RlciAtIENIQVJfRElHSVRfWkVSTykgPDwgaGV4T2Zmc2V0O1xuXG4gICAgICAgICAgfSBlbHNlIGlmIChDSEFSX0NBUElUQUxfQSA8PSBzdGF0ZS5jaGFyYWN0ZXIgJiYgc3RhdGUuY2hhcmFjdGVyIDw9IENIQVJfQ0FQSVRBTF9GKSB7XG4gICAgICAgICAgICBoZXhSZXN1bHQgfD0gKHN0YXRlLmNoYXJhY3RlciAtIENIQVJfQ0FQSVRBTF9BICsgMTApIDw8IGhleE9mZnNldDtcblxuICAgICAgICAgIH0gZWxzZSBpZiAoQ0hBUl9TTUFMTF9BIDw9IHN0YXRlLmNoYXJhY3RlciAmJiBzdGF0ZS5jaGFyYWN0ZXIgPD0gQ0hBUl9TTUFMTF9GKSB7XG4gICAgICAgICAgICBoZXhSZXN1bHQgfD0gKHN0YXRlLmNoYXJhY3RlciAtIENIQVJfU01BTExfQSArIDEwKSA8PCBoZXhPZmZzZXQ7XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2V4cGVjdGVkIGhleGFkZWNpbWFsIGNoYXJhY3RlcicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGhleFJlc3VsdCk7XG4gICAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmtub3duIGVzY2FwZSBzZXF1ZW5jZScpO1xuICAgICAgfVxuXG4gICAgICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG5cbiAgICB9IGVsc2UgaWYgKENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIHRydWUpO1xuICAgICAgd3JpdGVGb2xkZWRMaW5lcyhzdGF0ZSwgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgZmFsc2UsIG5vZGVJbmRlbnQpKTtcbiAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgfSBlbHNlIGlmIChzdGF0ZS5wb3NpdGlvbiA9PT0gc3RhdGUubGluZVN0YXJ0ICYmIHRlc3REb2N1bWVudFNlcGFyYXRvcihzdGF0ZSkpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgZG9jdW1lbnQgd2l0aGluIGEgZG91YmxlIHF1b3RlZCBzY2FsYXInKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgIH1cbiAgfVxuXG4gIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgc3RyZWFtIHdpdGhpbiBhIGRvdWJsZSBxdW90ZWQgc2NhbGFyJyk7XG59XG5cbmZ1bmN0aW9uIHJlYWRGbG93Q29sbGVjdGlvbihzdGF0ZSwgbm9kZUluZGVudCkge1xuICB2YXIgcmVhZE5leHQgPSB0cnVlLFxuICAgICAgX2xpbmUsXG4gICAgICBfdGFnICAgICA9IHN0YXRlLnRhZyxcbiAgICAgIF9yZXN1bHQsXG4gICAgICBmb2xsb3dpbmcsXG4gICAgICB0ZXJtaW5hdG9yLFxuICAgICAgaXNQYWlyLFxuICAgICAgaXNFeHBsaWNpdFBhaXIsXG4gICAgICBpc01hcHBpbmcsXG4gICAgICBrZXlOb2RlLFxuICAgICAga2V5VGFnLFxuICAgICAgdmFsdWVOb2RlO1xuXG4gIHN3aXRjaCAoc3RhdGUuY2hhcmFjdGVyKSB7XG4gIGNhc2UgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUOlxuICAgIHRlcm1pbmF0b3IgPSBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUO1xuICAgIGlzTWFwcGluZyA9IGZhbHNlO1xuICAgIF9yZXN1bHQgPSBbXTtcbiAgICBicmVhaztcblxuICBjYXNlIENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUOlxuICAgIHRlcm1pbmF0b3IgPSBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQ7XG4gICAgaXNNYXBwaW5nID0gdHJ1ZTtcbiAgICBfcmVzdWx0ID0ge307XG4gICAgYnJlYWs7XG5cbiAgZGVmYXVsdDpcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAobnVsbCAhPT0gc3RhdGUuYW5jaG9yKSB7XG4gICAgc3RhdGUuYW5jaG9yTWFwW3N0YXRlLmFuY2hvcl0gPSBfcmVzdWx0O1xuICB9XG5cbiAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCBub2RlSW5kZW50KTtcblxuICAgIGlmIChzdGF0ZS5jaGFyYWN0ZXIgPT09IHRlcm1pbmF0b3IpIHtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgICAgc3RhdGUua2luZCA9IGlzTWFwcGluZyA/ICdtYXBwaW5nJyA6ICdzZXF1ZW5jZSc7XG4gICAgICBzdGF0ZS5yZXN1bHQgPSBfcmVzdWx0O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmICghcmVhZE5leHQpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdtaXNzZWQgY29tbWEgYmV0d2VlbiBmbG93IGNvbGxlY3Rpb24gZW50cmllcycpO1xuICAgIH1cblxuICAgIGtleVRhZyA9IGtleU5vZGUgPSB2YWx1ZU5vZGUgPSBudWxsO1xuICAgIGlzUGFpciA9IGlzRXhwbGljaXRQYWlyID0gZmFsc2U7XG5cbiAgICBpZiAoQ0hBUl9RVUVTVElPTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBmb2xsb3dpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSk7XG5cbiAgICAgIGlmIChDSEFSX1NQQUNFID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgICBDSEFSX1RBQiA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBmb2xsb3dpbmcpIHtcbiAgICAgICAgaXNQYWlyID0gaXNFeHBsaWNpdFBhaXIgPSB0cnVlO1xuICAgICAgICBzdGF0ZS5wb3NpdGlvbiArPSAxO1xuICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBmb2xsb3dpbmc7XG4gICAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIG5vZGVJbmRlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIF9saW5lID0gc3RhdGUubGluZTtcbiAgICBjb21wb3NlTm9kZShzdGF0ZSwgbm9kZUluZGVudCwgQ09OVEVYVF9GTE9XX0lOLCBmYWxzZSwgdHJ1ZSk7XG4gICAga2V5VGFnID0gc3RhdGUudGFnO1xuICAgIGtleU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG5cbiAgICBpZiAoKGlzRXhwbGljaXRQYWlyIHx8IHN0YXRlLmxpbmUgPT09IF9saW5lKSAmJiBDSEFSX0NPTE9OID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGlzUGFpciA9IHRydWU7XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG4gICAgICBjb21wb3NlTm9kZShzdGF0ZSwgbm9kZUluZGVudCwgQ09OVEVYVF9GTE9XX0lOLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICB2YWx1ZU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG4gICAgfVxuXG4gICAgaWYgKGlzTWFwcGluZykge1xuICAgICAgc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgX3Jlc3VsdCwga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUpO1xuICAgIH0gZWxzZSBpZiAoaXNQYWlyKSB7XG4gICAgICBfcmVzdWx0LnB1c2goc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgbnVsbCwga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgX3Jlc3VsdC5wdXNoKGtleU5vZGUpO1xuICAgIH1cblxuICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIG5vZGVJbmRlbnQpO1xuXG4gICAgaWYgKENIQVJfQ09NTUEgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgcmVhZE5leHQgPSB0cnVlO1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVhZE5leHQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICB0aHJvd0Vycm9yKHN0YXRlLCAndW5leHBlY3RlZCBlbmQgb2YgdGhlIHN0cmVhbSB3aXRoaW4gYSBmbG93IGNvbGxlY3Rpb24nKTtcbn1cblxuZnVuY3Rpb24gcmVhZEJsb2NrU2NhbGFyKHN0YXRlLCBub2RlSW5kZW50KSB7XG4gIHZhciBjYXB0dXJlU3RhcnQsXG4gICAgICBmb2xkaW5nLFxuICAgICAgY2hvbXBpbmcgICAgICAgPSBDSE9NUElOR19DTElQLFxuICAgICAgZGV0ZWN0ZWRJbmRlbnQgPSBmYWxzZSxcbiAgICAgIHRleHRJbmRlbnQgICAgID0gbm9kZUluZGVudCxcbiAgICAgIGVtcHR5TGluZXMgICAgID0gMCxcbiAgICAgIGF0TW9yZUluZGVudGVkID0gZmFsc2U7XG5cbiAgc3dpdGNoIChzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgY2FzZSBDSEFSX1ZFUlRJQ0FMX0xJTkU6XG4gICAgZm9sZGluZyA9IGZhbHNlO1xuICAgIGJyZWFrO1xuXG4gIGNhc2UgQ0hBUl9HUkVBVEVSX1RIQU46XG4gICAgZm9sZGluZyA9IHRydWU7XG4gICAgYnJlYWs7XG5cbiAgZGVmYXVsdDpcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0ZS5raW5kID0gJ3NjYWxhcic7XG4gIHN0YXRlLnJlc3VsdCA9ICcnO1xuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICBpZiAoQ0hBUl9QTFVTID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9NSU5VUyA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBpZiAoQ0hPTVBJTkdfQ0xJUCA9PT0gY2hvbXBpbmcpIHtcbiAgICAgICAgY2hvbXBpbmcgPSAoQ0hBUl9QTFVTID09PSBzdGF0ZS5jaGFyYWN0ZXIpID8gQ0hPTVBJTkdfS0VFUCA6IENIT01QSU5HX1NUUklQO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3JlcGVhdCBvZiBhIGNob21waW5nIG1vZGUgaWRlbnRpZmllcicpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChDSEFSX0RJR0lUX1pFUk8gPD0gc3RhdGUuY2hhcmFjdGVyICYmIHN0YXRlLmNoYXJhY3RlciA8PSBDSEFSX0RJR0lUX05JTkUpIHtcbiAgICAgIGlmIChDSEFSX0RJR0lUX1pFUk8gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnYmFkIGV4cGxpY2l0IGluZGVudGF0aW9uIHdpZHRoIG9mIGEgYmxvY2sgc2NhbGFyOyBpdCBjYW5ub3QgYmUgbGVzcyB0aGFuIG9uZScpO1xuICAgICAgfSBlbHNlIGlmICghZGV0ZWN0ZWRJbmRlbnQpIHtcbiAgICAgICAgdGV4dEluZGVudCA9IG5vZGVJbmRlbnQgKyAoc3RhdGUuY2hhcmFjdGVyIC0gQ0hBUl9ESUdJVF9PTkUpO1xuICAgICAgICBkZXRlY3RlZEluZGVudCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAncmVwZWF0IG9mIGFuIGluZGVudGF0aW9uIHdpZHRoIGlkZW50aWZpZXInKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoQ0hBUl9TUEFDRSA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8IENIQVJfVEFCID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICBkbyB7IHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7IH1cbiAgICB3aGlsZSAoQ0hBUl9TUEFDRSA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8IENIQVJfVEFCID09PSBzdGF0ZS5jaGFyYWN0ZXIpO1xuXG4gICAgaWYgKENIQVJfU0hBUlAgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgZG8geyBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pOyB9XG4gICAgICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGggJiZcbiAgICAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gIT09IHN0YXRlLmNoYXJhY3Rlcik7XG4gICAgfVxuICB9XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgcmVhZExpbmVCcmVhayhzdGF0ZSk7XG4gICAgc3RhdGUubGluZUluZGVudCA9IDA7XG5cbiAgICB3aGlsZSAoKCFkZXRlY3RlZEluZGVudCB8fCBzdGF0ZS5saW5lSW5kZW50IDwgdGV4dEluZGVudCkgJiZcbiAgICAgICAgICAgKENIQVJfU1BBQ0UgPT09IHN0YXRlLmNoYXJhY3RlcikpIHtcbiAgICAgIHN0YXRlLmxpbmVJbmRlbnQgKz0gMTtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKCFkZXRlY3RlZEluZGVudCAmJiBzdGF0ZS5saW5lSW5kZW50ID4gdGV4dEluZGVudCkge1xuICAgICAgdGV4dEluZGVudCA9IHN0YXRlLmxpbmVJbmRlbnQ7XG4gICAgfVxuXG4gICAgaWYgKENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgZW1wdHlMaW5lcyArPSAxO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gRW5kIG9mIHRoZSBzY2FsYXIuXG4gICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPCB0ZXh0SW5kZW50KSB7XG5cbiAgICAgIC8vIFBlcmZvcm0gdGhlIGNob21waW5nLlxuICAgICAgc3dpdGNoIChjaG9tcGluZykge1xuICAgICAgY2FzZSBDSE9NUElOR19LRUVQOlxuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnXFxuJywgZW1wdHlMaW5lcyk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIENIT01QSU5HX0NMSVA6XG4gICAgICAgIGlmIChkZXRlY3RlZEluZGVudCkgeyAvLyBpLmUuIG9ubHkgaWYgdGhlIHNjYWxhciBpcyBub3QgZW1wdHkuXG4gICAgICAgICAgc3RhdGUucmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBCcmVhayB0aGlzIGB3aGlsZWAgY3ljbGUgYW5kIGdvIHRvIHRoZSBmdW5jaXRvbidzIGVwaWxvZ3VlLlxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gRm9sZGVkIHN0eWxlOiB1c2UgZmFuY3kgcnVsZXMgdG8gaGFuZGxlIGxpbmUgYnJlYWtzLlxuICAgIGlmIChmb2xkaW5nKSB7XG5cbiAgICAgIC8vIExpbmVzIHN0YXJ0aW5nIHdpdGggd2hpdGUgc3BhY2UgY2hhcmFjdGVycyAobW9yZS1pbmRlbnRlZCBsaW5lcykgYXJlIG5vdCBmb2xkZWQuXG4gICAgICBpZiAoQ0hBUl9TUEFDRSA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8IENIQVJfVEFCID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgYXRNb3JlSW5kZW50ZWQgPSB0cnVlO1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnXFxuJywgZW1wdHlMaW5lcyArIDEpO1xuXG4gICAgICAvLyBFbmQgb2YgbW9yZS1pbmRlbnRlZCBibG9jay5cbiAgICAgIH0gZWxzZSBpZiAoYXRNb3JlSW5kZW50ZWQpIHtcbiAgICAgICAgYXRNb3JlSW5kZW50ZWQgPSBmYWxzZTtcbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJ1xcbicsIGVtcHR5TGluZXMgKyAxKTtcblxuICAgICAgLy8gSnVzdCBvbmUgbGluZSBicmVhayAtIHBlcmNlaXZlIGFzIHRoZSBzYW1lIGxpbmUuXG4gICAgICB9IGVsc2UgaWYgKDAgPT09IGVtcHR5TGluZXMpIHtcbiAgICAgICAgaWYgKGRldGVjdGVkSW5kZW50KSB7IC8vIGkuZS4gb25seSBpZiB3ZSBoYXZlIGFscmVhZHkgcmVhZCBzb21lIHNjYWxhciBjb250ZW50LlxuICAgICAgICAgIHN0YXRlLnJlc3VsdCArPSAnICc7XG4gICAgICAgIH1cblxuICAgICAgLy8gU2V2ZXJhbCBsaW5lIGJyZWFrcyAtIHBlcmNlaXZlIGFzIGRpZmZlcmVudCBsaW5lcy5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBlbXB0eUxpbmVzKTtcbiAgICAgIH1cblxuICAgIC8vIExpdGVyYWwgc3R5bGU6IGp1c3QgYWRkIGV4YWN0IG51bWJlciBvZiBsaW5lIGJyZWFrcyBiZXR3ZWVuIGNvbnRlbnQgbGluZXMuXG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gSWYgY3VycmVudCBsaW5lIGlzbid0IHRoZSBmaXJzdCBvbmUgLSBjb3VudCBsaW5lIGJyZWFrIGZyb20gdGhlIGxhc3QgY29udGVudCBsaW5lLlxuICAgICAgaWYgKGRldGVjdGVkSW5kZW50KSB7XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBlbXB0eUxpbmVzICsgMSk7XG5cbiAgICAgIC8vIEluIGNhc2Ugb2YgdGhlIGZpcnN0IGNvbnRlbnQgbGluZSAtIGNvdW50IG9ubHkgZW1wdHkgbGluZXMuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnXFxuJywgZW1wdHlMaW5lcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGV0ZWN0ZWRJbmRlbnQgPSB0cnVlO1xuICAgIGVtcHR5TGluZXMgPSAwO1xuICAgIGNhcHR1cmVTdGFydCA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gICAgZG8geyBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pOyB9XG4gICAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoICYmXG4gICAgICAgICAgIENIQVJfTElORV9GRUVEICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gIT09IHN0YXRlLmNoYXJhY3Rlcik7XG5cbiAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBzdGF0ZS5wb3NpdGlvbiwgZmFsc2UpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlYWRCbG9ja1NlcXVlbmNlKHN0YXRlLCBub2RlSW5kZW50KSB7XG4gIHZhciBfbGluZSxcbiAgICAgIF90YWcgICAgICA9IHN0YXRlLnRhZyxcbiAgICAgIF9yZXN1bHQgICA9IFtdLFxuICAgICAgZm9sbG93aW5nLFxuICAgICAgZGV0ZWN0ZWQgID0gZmFsc2U7XG5cbiAgaWYgKG51bGwgIT09IHN0YXRlLmFuY2hvcikge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gX3Jlc3VsdDtcbiAgfVxuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgIGlmIChDSEFSX01JTlVTICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgIGlmIChDSEFSX1NQQUNFICAgICAgICAgICAhPT0gZm9sbG93aW5nICYmXG4gICAgICAgIENIQVJfVEFCICAgICAgICAgICAgICE9PSBmb2xsb3dpbmcgJiZcbiAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgICAgICAgIT09IGZvbGxvd2luZyAmJlxuICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiAhPT0gZm9sbG93aW5nKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBkZXRlY3RlZCA9IHRydWU7XG4gICAgc3RhdGUucG9zaXRpb24gKz0gMTtcbiAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBmb2xsb3dpbmc7XG5cbiAgICBpZiAoc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpKSB7XG4gICAgICBpZiAoc3RhdGUubGluZUluZGVudCA8PSBub2RlSW5kZW50KSB7XG4gICAgICAgIF9yZXN1bHQucHVzaChudWxsKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgX2xpbmUgPSBzdGF0ZS5saW5lO1xuICAgIGNvbXBvc2VOb2RlKHN0YXRlLCBub2RlSW5kZW50LCBDT05URVhUX0JMT0NLX0lOLCBmYWxzZSwgdHJ1ZSk7XG4gICAgX3Jlc3VsdC5wdXNoKHN0YXRlLnJlc3VsdCk7XG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gICAgaWYgKChzdGF0ZS5saW5lID09PSBfbGluZSB8fCBzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCkgJiYgc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdiYWQgaW5kZW50YXRpb24gb2YgYSBzZXF1ZW5jZSBlbnRyeScpO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA8IG5vZGVJbmRlbnQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkZXRlY3RlZCkge1xuICAgIHN0YXRlLnRhZyA9IF90YWc7XG4gICAgc3RhdGUua2luZCA9ICdzZXF1ZW5jZSc7XG4gICAgc3RhdGUucmVzdWx0ID0gX3Jlc3VsdDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZEJsb2NrTWFwcGluZyhzdGF0ZSwgbm9kZUluZGVudCkge1xuICB2YXIgZm9sbG93aW5nLFxuICAgICAgYWxsb3dDb21wYWN0LFxuICAgICAgX2xpbmUsXG4gICAgICBfdGFnICAgICAgICAgID0gc3RhdGUudGFnLFxuICAgICAgX3Jlc3VsdCAgICAgICA9IHt9LFxuICAgICAga2V5VGFnICAgICAgICA9IG51bGwsXG4gICAgICBrZXlOb2RlICAgICAgID0gbnVsbCxcbiAgICAgIHZhbHVlTm9kZSAgICAgPSBudWxsLFxuICAgICAgYXRFeHBsaWNpdEtleSA9IGZhbHNlLFxuICAgICAgZGV0ZWN0ZWQgICAgICA9IGZhbHNlO1xuXG4gIGlmIChudWxsICE9PSBzdGF0ZS5hbmNob3IpIHtcbiAgICBzdGF0ZS5hbmNob3JNYXBbc3RhdGUuYW5jaG9yXSA9IF9yZXN1bHQ7XG4gIH1cblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICBmb2xsb3dpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSk7XG4gICAgX2xpbmUgPSBzdGF0ZS5saW5lOyAvLyBTYXZlIHRoZSBjdXJyZW50IGxpbmUuXG5cbiAgICAvL1xuICAgIC8vIEV4cGxpY2l0IG5vdGF0aW9uIGNhc2UuIFRoZXJlIGFyZSB0d28gc2VwYXJhdGUgYmxvY2tzOlxuICAgIC8vIGZpcnN0IGZvciB0aGUga2V5IChkZW5vdGVkIGJ5IFwiP1wiKSBhbmQgc2Vjb25kIGZvciB0aGUgdmFsdWUgKGRlbm90ZWQgYnkgXCI6XCIpXG4gICAgLy9cbiAgICBpZiAoKENIQVJfUVVFU1RJT04gICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgICAgIENIQVJfQ09MT04gICAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIpICYmXG4gICAgICAgIChDSEFSX1NQQUNFICAgICAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiA9PT0gZm9sbG93aW5nKSkge1xuXG4gICAgICBpZiAoQ0hBUl9RVUVTVElPTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgICAgc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgX3Jlc3VsdCwga2V5VGFnLCBrZXlOb2RlLCBudWxsKTtcbiAgICAgICAgICBrZXlUYWcgPSBrZXlOb2RlID0gdmFsdWVOb2RlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGRldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgYXRFeHBsaWNpdEtleSA9IHRydWU7XG4gICAgICAgIGFsbG93Q29tcGFjdCA9IHRydWU7XG5cbiAgICAgIH0gZWxzZSBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgICAgICAvLyBpLmUuIENIQVJfQ09MT04gPT09IGNoYXJhY3RlciBhZnRlciB0aGUgZXhwbGljaXQga2V5LlxuICAgICAgICBhdEV4cGxpY2l0S2V5ID0gZmFsc2U7XG4gICAgICAgIGFsbG93Q29tcGFjdCA9IHRydWU7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdpbmNvbXBsZXRlIGV4cGxpY2l0IG1hcHBpbmcgcGFpcjsgYSBrZXkgbm9kZSBpcyBtaXNzZWQnKTtcbiAgICAgIH1cblxuICAgICAgc3RhdGUucG9zaXRpb24gKz0gMTtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IGZvbGxvd2luZztcblxuICAgIC8vXG4gICAgLy8gSW1wbGljaXQgbm90YXRpb24gY2FzZS4gRmxvdy1zdHlsZSBub2RlIGFzIHRoZSBrZXkgZmlyc3QsIHRoZW4gXCI6XCIsIGFuZCB0aGUgdmFsdWUuXG4gICAgLy9cbiAgICB9IGVsc2UgaWYgKGNvbXBvc2VOb2RlKHN0YXRlLCBub2RlSW5kZW50LCBDT05URVhUX0ZMT1dfT1VULCBmYWxzZSwgdHJ1ZSkpIHtcbiAgICAgIGlmIChzdGF0ZS5saW5lID09PSBfbGluZSkge1xuICAgICAgICB3aGlsZSAoQ0hBUl9TUEFDRSA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICAgICAgICAgICBDSEFSX1RBQiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChDSEFSX0NPTE9OID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICAgICAgaWYgKENIQVJfU1BBQ0UgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgICAgQ0hBUl9UQUIgICAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdhIHdoaXRlc3BhY2UgY2hhcmFjdGVyIGlzIGV4cGVjdGVkIGFmdGVyIHRoZSBrZXktdmFsdWUgc2VwYXJhdG9yIHdpdGhpbiBhIGJsb2NrIG1hcHBpbmcnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgICAgICAgICAgc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgX3Jlc3VsdCwga2V5VGFnLCBrZXlOb2RlLCBudWxsKTtcbiAgICAgICAgICAgIGtleVRhZyA9IGtleU5vZGUgPSB2YWx1ZU5vZGUgPSBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGRldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICBhdEV4cGxpY2l0S2V5ID0gZmFsc2U7XG4gICAgICAgICAgYWxsb3dDb21wYWN0ID0gZmFsc2U7XG4gICAgICAgICAga2V5VGFnID0gc3RhdGUudGFnO1xuICAgICAgICAgIGtleU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG5cbiAgICAgICAgfSBlbHNlIGlmIChkZXRlY3RlZCkge1xuICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdjYW4gbm90IHJlYWQgYW4gaW1wbGljaXQgbWFwcGluZyBwYWlyOyBhIGNvbG9uIGlzIG1pc3NlZCcpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGUudGFnID0gX3RhZztcbiAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gS2VlcCB0aGUgcmVzdWx0IG9mIGBjb21wb3NlTm9kZWAuXG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIGlmIChkZXRlY3RlZCkge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnY2FuIG5vdCByZWFkIGEgYmxvY2sgbWFwcGluZyBlbnRyeTsgYSBtdWx0aWxpbmUga2V5IG1heSBub3QgYmUgYW4gaW1wbGljaXQga2V5Jyk7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnRhZyA9IF90YWc7XG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBLZWVwIHRoZSByZXN1bHQgb2YgYGNvbXBvc2VOb2RlYC5cbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBicmVhazsgLy8gUmVhZGluZyBpcyBkb25lLiBHbyB0byB0aGUgZXBpbG9ndWUuXG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBDb21tb24gcmVhZGluZyBjb2RlIGZvciBib3RoIGV4cGxpY2l0IGFuZCBpbXBsaWNpdCBub3RhdGlvbnMuXG4gICAgLy9cbiAgICBpZiAoc3RhdGUubGluZSA9PT0gX2xpbmUgfHwgc3RhdGUubGluZUluZGVudCA+IG5vZGVJbmRlbnQpIHtcbiAgICAgIGlmIChjb21wb3NlTm9kZShzdGF0ZSwgbm9kZUluZGVudCwgQ09OVEVYVF9CTE9DS19PVVQsIHRydWUsIGFsbG93Q29tcGFjdCkpIHtcbiAgICAgICAgaWYgKGF0RXhwbGljaXRLZXkpIHtcbiAgICAgICAgICBrZXlOb2RlID0gc3RhdGUucmVzdWx0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlTm9kZSA9IHN0YXRlLnJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWF0RXhwbGljaXRLZXkpIHtcbiAgICAgICAgc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgX3Jlc3VsdCwga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUpO1xuICAgICAgICBrZXlUYWcgPSBrZXlOb2RlID0gdmFsdWVOb2RlID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCAmJiBzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2JhZCBpbmRlbnRhdGlvbiBvZiBhIG1hcHBpbmcgZW50cnknKTtcbiAgICB9IGVsc2UgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPCBub2RlSW5kZW50KSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBFcGlsb2d1ZS5cbiAgLy9cblxuICAvLyBTcGVjaWFsIGNhc2U6IGxhc3QgbWFwcGluZydzIG5vZGUgY29udGFpbnMgb25seSB0aGUga2V5IGluIGV4cGxpY2l0IG5vdGF0aW9uLlxuICBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgIHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIF9yZXN1bHQsIGtleVRhZywga2V5Tm9kZSwgbnVsbCk7XG4gIH1cblxuICAvLyBFeHBvc2UgdGhlIHJlc3VsdGluZyBtYXBwaW5nLlxuICBpZiAoZGV0ZWN0ZWQpIHtcbiAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgIHN0YXRlLmtpbmQgPSAnbWFwcGluZyc7XG4gICAgc3RhdGUucmVzdWx0ID0gX3Jlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBkZXRlY3RlZDtcbn1cblxuZnVuY3Rpb24gcmVhZFRhZ1Byb3BlcnR5KHN0YXRlKSB7XG4gIHZhciBfcG9zaXRpb24sXG4gICAgICBpc1ZlcmJhdGltID0gZmFsc2UsXG4gICAgICBpc05hbWVkICAgID0gZmFsc2UsXG4gICAgICB0YWdIYW5kbGUsXG4gICAgICB0YWdOYW1lO1xuXG4gIGlmIChDSEFSX0VYQ0xBTUFUSU9OICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAobnVsbCAhPT0gc3RhdGUudGFnKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2R1cGxpY2F0aW9uIG9mIGEgdGFnIHByb3BlcnR5Jyk7XG4gIH1cblxuICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmIChDSEFSX0xFU1NfVEhBTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgaXNWZXJiYXRpbSA9IHRydWU7XG4gICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICB9IGVsc2UgaWYgKENIQVJfRVhDTEFNQVRJT04gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIGlzTmFtZWQgPSB0cnVlO1xuICAgIHRhZ0hhbmRsZSA9ICchISc7XG4gICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICB9IGVsc2Uge1xuICAgIHRhZ0hhbmRsZSA9ICchJztcbiAgfVxuXG4gIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIGlmIChpc1ZlcmJhdGltKSB7XG4gICAgZG8geyBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pOyB9XG4gICAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoICYmIENIQVJfR1JFQVRFUl9USEFOICE9PSBzdGF0ZS5jaGFyYWN0ZXIpO1xuXG4gICAgaWYgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgICB0YWdOYW1lID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5leHBlY3RlZCBlbmQgb2YgdGhlIHN0cmVhbSB3aXRoaW4gYSB2ZXJiYXRpbSB0YWcnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoICYmXG4gICAgICAgICAgIENIQVJfU1BBQ0UgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgQ0hBUl9UQUIgICAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcblxuICAgICAgaWYgKENIQVJfRVhDTEFNQVRJT04gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICBpZiAoIWlzTmFtZWQpIHtcbiAgICAgICAgICB0YWdIYW5kbGUgPSBzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24gLSAxLCBzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgICAgICAgaWYgKCFQQVRURVJOX1RBR19IQU5ETEUudGVzdCh0YWdIYW5kbGUpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbmFtZWQgdGFnIGhhbmRsZSBjYW5ub3QgY29udGFpbiBzdWNoIGNoYXJhY3RlcnMnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpc05hbWVkID0gdHJ1ZTtcbiAgICAgICAgICBfcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbiArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RhZyBzdWZmaXggY2Fubm90IGNvbnRhaW4gZXhjbGFtYXRpb24gbWFya3MnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH1cblxuICAgIHRhZ05hbWUgPSBzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24sIHN0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmIChQQVRURVJOX0ZMT1dfSU5ESUNBVE9SUy50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndGFnIHN1ZmZpeCBjYW5ub3QgY29udGFpbiBmbG93IGluZGljYXRvciBjaGFyYWN0ZXJzJyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRhZ05hbWUgJiYgIVBBVFRFUk5fVEFHX1VSSS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RhZyBuYW1lIGNhbm5vdCBjb250YWluIHN1Y2ggY2hhcmFjdGVyczogJyArIHRhZ05hbWUpO1xuICB9XG5cbiAgaWYgKGlzVmVyYmF0aW0pIHtcbiAgICBzdGF0ZS50YWcgPSB0YWdOYW1lO1xuXG4gIH0gZWxzZSBpZiAoX2hhc093blByb3BlcnR5LmNhbGwoc3RhdGUudGFnTWFwLCB0YWdIYW5kbGUpKSB7XG4gICAgc3RhdGUudGFnID0gc3RhdGUudGFnTWFwW3RhZ0hhbmRsZV0gKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSBpZiAoJyEnID09PSB0YWdIYW5kbGUpIHtcbiAgICBzdGF0ZS50YWcgPSAnIScgKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSBpZiAoJyEhJyA9PT0gdGFnSGFuZGxlKSB7XG4gICAgc3RhdGUudGFnID0gJ3RhZzp5YW1sLm9yZywyMDAyOicgKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZGVjbGFyZWQgdGFnIGhhbmRsZSBcIicgKyB0YWdIYW5kbGUgKyAnXCInKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZWFkQW5jaG9yUHJvcGVydHkoc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbjtcblxuICBpZiAoQ0hBUl9BTVBFUlNBTkQgIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChudWxsICE9PSBzdGF0ZS5hbmNob3IpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZHVwbGljYXRpb24gb2YgYW4gYW5jaG9yIHByb3BlcnR5Jyk7XG4gIH1cblxuICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICBfcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbjtcblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGggJiZcbiAgICAgICAgIENIQVJfU1BBQ0UgICAgICAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9UQUIgICAgICAgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9DT01NQSAgICAgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVQgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQgICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBfcG9zaXRpb24pIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbmFtZSBvZiBhbiBhbmNob3Igbm9kZSBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGNoYXJhY3RlcicpO1xuICB9XG5cbiAgc3RhdGUuYW5jaG9yID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZWFkQWxpYXMoc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbiwgYWxpYXM7XG5cbiAgaWYgKENIQVJfQVNURVJJU0sgIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCAmJlxuICAgICAgICAgQ0hBUl9TUEFDRSAgICAgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfTElORV9GRUVEICAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX0NPTU1BICAgICAgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVCAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCAgIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIH1cblxuICBpZiAoc3RhdGUucG9zaXRpb24gPT09IF9wb3NpdGlvbikge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICduYW1lIG9mIGFuIGFsaWFzIG5vZGUgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSBjaGFyYWN0ZXInKTtcbiAgfVxuXG4gIGFsaWFzID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKCFzdGF0ZS5hbmNob3JNYXAuaGFzT3duUHJvcGVydHkoYWxpYXMpKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuaWRlbnRpZmllZCBhbGlhcyBcIicgKyBhbGlhcyArICdcIicpO1xuICB9XG5cbiAgc3RhdGUucmVzdWx0ID0gc3RhdGUuYW5jaG9yTWFwW2FsaWFzXTtcbiAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gY29tcG9zZU5vZGUoc3RhdGUsIHBhcmVudEluZGVudCwgbm9kZUNvbnRleHQsIGFsbG93VG9TZWVrLCBhbGxvd0NvbXBhY3QpIHtcbiAgdmFyIGFsbG93QmxvY2tTdHlsZXMsXG4gICAgICBhbGxvd0Jsb2NrU2NhbGFycyxcbiAgICAgIGFsbG93QmxvY2tDb2xsZWN0aW9ucyxcbiAgICAgIGF0TmV3TGluZSAgPSBmYWxzZSxcbiAgICAgIGlzSW5kZW50ZWQgPSB0cnVlLFxuICAgICAgaGFzQ29udGVudCA9IGZhbHNlLFxuICAgICAgdHlwZUluZGV4LFxuICAgICAgdHlwZVF1YW50aXR5LFxuICAgICAgdHlwZSxcbiAgICAgIGZsb3dJbmRlbnQsXG4gICAgICBibG9ja0luZGVudCxcbiAgICAgIF9yZXN1bHQ7XG5cbiAgc3RhdGUudGFnICAgID0gbnVsbDtcbiAgc3RhdGUuYW5jaG9yID0gbnVsbDtcbiAgc3RhdGUua2luZCAgID0gbnVsbDtcbiAgc3RhdGUucmVzdWx0ID0gbnVsbDtcblxuICBhbGxvd0Jsb2NrU3R5bGVzID0gYWxsb3dCbG9ja1NjYWxhcnMgPSBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgPVxuICAgIENPTlRFWFRfQkxPQ0tfT1VUID09PSBub2RlQ29udGV4dCB8fFxuICAgIENPTlRFWFRfQkxPQ0tfSU4gID09PSBub2RlQ29udGV4dDtcblxuICBpZiAoYWxsb3dUb1NlZWspIHtcbiAgICBpZiAoc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpKSB7XG4gICAgICBhdE5ld0xpbmUgPSB0cnVlO1xuXG4gICAgICBpZiAoc3RhdGUubGluZUluZGVudCA9PT0gcGFyZW50SW5kZW50KSB7XG4gICAgICAgIGlzSW5kZW50ZWQgPSBmYWxzZTtcblxuICAgICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50ID4gcGFyZW50SW5kZW50KSB7XG4gICAgICAgIGlzSW5kZW50ZWQgPSB0cnVlO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGlzSW5kZW50ZWQpIHtcbiAgICB3aGlsZSAocmVhZFRhZ1Byb3BlcnR5KHN0YXRlKSB8fCByZWFkQW5jaG9yUHJvcGVydHkoc3RhdGUpKSB7XG4gICAgICBpZiAoc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpKSB7XG4gICAgICAgIGF0TmV3TGluZSA9IHRydWU7XG5cbiAgICAgICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPiBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgICBpc0luZGVudGVkID0gdHJ1ZTtcbiAgICAgICAgICBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgPSBhbGxvd0Jsb2NrU3R5bGVzO1xuXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA9PT0gcGFyZW50SW5kZW50KSB7XG4gICAgICAgICAgaXNJbmRlbnRlZCA9IGZhbHNlO1xuICAgICAgICAgIGFsbG93QmxvY2tDb2xsZWN0aW9ucyA9IGFsbG93QmxvY2tTdHlsZXM7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxsb3dCbG9ja0NvbGxlY3Rpb25zID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGFsbG93QmxvY2tDb2xsZWN0aW9ucykge1xuICAgIGFsbG93QmxvY2tDb2xsZWN0aW9ucyA9IGF0TmV3TGluZSB8fCBhbGxvd0NvbXBhY3Q7XG4gIH1cblxuICBpZiAoaXNJbmRlbnRlZCB8fCBDT05URVhUX0JMT0NLX09VVCA9PT0gbm9kZUNvbnRleHQpIHtcbiAgICBpZiAoQ09OVEVYVF9GTE9XX0lOID09PSBub2RlQ29udGV4dCB8fCBDT05URVhUX0ZMT1dfT1VUID09PSBub2RlQ29udGV4dCkge1xuICAgICAgZmxvd0luZGVudCA9IHBhcmVudEluZGVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxvd0luZGVudCA9IHBhcmVudEluZGVudCArIDE7XG4gICAgfVxuXG4gICAgYmxvY2tJbmRlbnQgPSBzdGF0ZS5wb3NpdGlvbiAtIHN0YXRlLmxpbmVTdGFydDtcblxuICAgIGlmIChpc0luZGVudGVkKSB7XG4gICAgICBpZiAoYWxsb3dCbG9ja0NvbGxlY3Rpb25zICYmXG4gICAgICAgICAgKHJlYWRCbG9ja1NlcXVlbmNlKHN0YXRlLCBibG9ja0luZGVudCkgfHxcbiAgICAgICAgICAgcmVhZEJsb2NrTWFwcGluZyhzdGF0ZSwgYmxvY2tJbmRlbnQpKSB8fFxuICAgICAgICAgIHJlYWRGbG93Q29sbGVjdGlvbihzdGF0ZSwgZmxvd0luZGVudCkpIHtcbiAgICAgICAgaGFzQ29udGVudCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKGFsbG93QmxvY2tTY2FsYXJzICYmIHJlYWRCbG9ja1NjYWxhcihzdGF0ZSwgZmxvd0luZGVudCkpIHx8XG4gICAgICAgICAgICByZWFkU2luZ2xlUXVvdGVkU2NhbGFyKHN0YXRlLCBmbG93SW5kZW50KSB8fFxuICAgICAgICAgICAgcmVhZERvdWJsZVF1b3RlZFNjYWxhcihzdGF0ZSwgZmxvd0luZGVudCkpIHtcbiAgICAgICAgICBoYXNDb250ZW50ID0gdHJ1ZTtcblxuICAgICAgICB9IGVsc2UgaWYgKHJlYWRBbGlhcyhzdGF0ZSkpIHtcbiAgICAgICAgICBoYXNDb250ZW50ID0gdHJ1ZTtcblxuICAgICAgICAgIGlmIChudWxsICE9PSBzdGF0ZS50YWcgfHwgbnVsbCAhPT0gc3RhdGUuYW5jaG9yKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnYWxpYXMgbm9kZSBzaG91bGQgbm90IGhhdmUgYW55IHByb3BlcnRpZXMnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIGlmIChyZWFkUGxhaW5TY2FsYXIoc3RhdGUsIGZsb3dJbmRlbnQsIENPTlRFWFRfRkxPV19JTiA9PT0gbm9kZUNvbnRleHQpKSB7XG4gICAgICAgICAgaGFzQ29udGVudCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAobnVsbCA9PT0gc3RhdGUudGFnKSB7XG4gICAgICAgICAgICBzdGF0ZS50YWcgPSAnPyc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG51bGwgIT09IHN0YXRlLmFuY2hvcikge1xuICAgICAgICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gc3RhdGUucmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGhhc0NvbnRlbnQgPSBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgJiYgcmVhZEJsb2NrU2VxdWVuY2Uoc3RhdGUsIGJsb2NrSW5kZW50KTtcbiAgICB9XG4gIH1cblxuICBpZiAobnVsbCAhPT0gc3RhdGUudGFnICYmICchJyAhPT0gc3RhdGUudGFnKSB7XG4gICAgaWYgKCc/JyA9PT0gc3RhdGUudGFnKSB7XG4gICAgICBmb3IgKHR5cGVJbmRleCA9IDAsIHR5cGVRdWFudGl0eSA9IHN0YXRlLmltcGxpY2l0VHlwZXMubGVuZ3RoO1xuICAgICAgICAgICB0eXBlSW5kZXggPCB0eXBlUXVhbnRpdHk7XG4gICAgICAgICAgIHR5cGVJbmRleCArPSAxKSB7XG4gICAgICAgIHR5cGUgPSBzdGF0ZS5pbXBsaWNpdFR5cGVzW3R5cGVJbmRleF07XG5cbiAgICAgICAgLy8gSW1wbGljaXQgcmVzb2x2aW5nIGlzIG5vdCBhbGxvd2VkIGZvciBub24tc2NhbGFyIHR5cGVzLCBhbmQgJz8nXG4gICAgICAgIC8vIG5vbi1zcGVjaWZpYyB0YWcgaXMgb25seSBhc3NpZ25lZCB0byBwbGFpbiBzY2FsYXJzLiBTbywgaXQgaXNuJ3RcbiAgICAgICAgLy8gbmVlZGVkIHRvIGNoZWNrIGZvciAna2luZCcgY29uZm9ybWl0eS5cblxuICAgICAgICBpZiAodHlwZS5sb2FkUmVzb2x2ZXIgJiYgdHlwZS5sb2FkUmVzb2x2ZXIoc3RhdGUpKSB7IC8vIGBzdGF0ZS5yZXN1bHRgIHVwZGF0ZWQgaW4gcmVzb2x2ZXIgaWYgbWF0Y2hlZFxuICAgICAgICAgIHN0YXRlLnRhZyA9IHR5cGUudGFnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXRlLnR5cGVNYXAsIHN0YXRlLnRhZykpIHtcbiAgICAgIHR5cGUgPSBzdGF0ZS50eXBlTWFwW3N0YXRlLnRhZ107XG5cbiAgICAgIGlmIChudWxsICE9PSBzdGF0ZS5yZXN1bHQgJiYgdHlwZS5sb2FkS2luZCAhPT0gc3RhdGUua2luZCkge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5hY2NlcHRhYmxlIG5vZGUga2luZCBmb3IgITwnICsgc3RhdGUudGFnICsgJz4gdGFnOyBpdCBzaG91bGQgYmUgXCInICsgdHlwZS5sb2FkS2luZCArICdcIiwgbm90IFwiJyArIHN0YXRlLmtpbmQgKyAnXCInKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGUubG9hZFJlc29sdmVyICYmICF0eXBlLmxvYWRSZXNvbHZlcihzdGF0ZSkpIHsgLy8gYHN0YXRlLnJlc3VsdGAgdXBkYXRlZCBpbiByZXNvbHZlciBpZiBtYXRjaGVkXG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdjYW5ub3QgcmVzb2x2ZSBhIG5vZGUgd2l0aCAhPCcgKyBzdGF0ZS50YWcgKyAnPiBleHBsaWNpdCB0YWcnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3dXYXJuaW5nKHN0YXRlLCAndW5rbm93biB0YWcgITwnICsgc3RhdGUudGFnICsgJz4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbCAhPT0gc3RhdGUudGFnIHx8IG51bGwgIT09IHN0YXRlLmFuY2hvciB8fCBoYXNDb250ZW50O1xufVxuXG5mdW5jdGlvbiByZWFkRG9jdW1lbnQoc3RhdGUsIGl0ZXJhdG9yKSB7XG4gIHZhciBkb2N1bWVudFN0YXJ0ID0gc3RhdGUucG9zaXRpb24sXG4gICAgICBfcG9zaXRpb24sXG4gICAgICBkaXJlY3RpdmVOYW1lLFxuICAgICAgZGlyZWN0aXZlQXJncyxcbiAgICAgIGhhc0RpcmVjdGl2ZXMgPSBmYWxzZTtcblxuICBzdGF0ZS52ZXJzaW9uID0gbnVsbDtcbiAgc3RhdGUuY2hlY2tMaW5lQnJlYWtzID0gc3RhdGUubGVnYWN5O1xuICBzdGF0ZS50YWdNYXAgPSB7fTtcbiAgc3RhdGUuYW5jaG9yTWFwID0ge307XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPiAwIHx8IENIQVJfUEVSQ0VOVCAhPT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBoYXNEaXJlY3RpdmVzID0gdHJ1ZTtcbiAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gICAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoICYmXG4gICAgICAgICAgIENIQVJfU1BBQ0UgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgQ0hBUl9UQUIgICAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgZGlyZWN0aXZlTmFtZSA9IHN0YXRlLmlucHV0LnNsaWNlKF9wb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pO1xuICAgIGRpcmVjdGl2ZUFyZ3MgPSBbXTtcblxuICAgIGlmIChkaXJlY3RpdmVOYW1lLmxlbmd0aCA8IDEpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdkaXJlY3RpdmUgbmFtZSBtdXN0IG5vdCBiZSBsZXNzIHRoYW4gb25lIGNoYXJhY3RlciBpbiBsZW5ndGgnKTtcbiAgICB9XG5cbiAgICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICAgIHdoaWxlIChDSEFSX1NQQUNFID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9UQUIgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgfVxuXG4gICAgICBpZiAoQ0hBUl9TSEFSUCA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgIGRvIHsgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTsgfVxuICAgICAgICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGggJiZcbiAgICAgICAgICAgICAgIENIQVJfTElORV9GRUVEICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICE9PSBzdGF0ZS5jaGFyYWN0ZXIpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgICAgIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCAmJlxuICAgICAgICAgICAgIENIQVJfU1BBQ0UgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIH1cblxuICAgICAgZGlyZWN0aXZlQXJncy5wdXNoKHN0YXRlLmlucHV0LnNsaWNlKF9wb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pKTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICAgIHJlYWRMaW5lQnJlYWsoc3RhdGUpO1xuICAgIH1cblxuICAgIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbChkaXJlY3RpdmVIYW5kbGVycywgZGlyZWN0aXZlTmFtZSkpIHtcbiAgICAgIGRpcmVjdGl2ZUhhbmRsZXJzW2RpcmVjdGl2ZU5hbWVdKHN0YXRlLCBkaXJlY3RpdmVOYW1lLCBkaXJlY3RpdmVBcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3dXYXJuaW5nKHN0YXRlLCAndW5rbm93biBkb2N1bWVudCBkaXJlY3RpdmUgXCInICsgZGlyZWN0aXZlTmFtZSArICdcIicpO1xuICAgIH1cbiAgfVxuXG4gIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcblxuICBpZiAoMCA9PT0gc3RhdGUubGluZUluZGVudCAmJlxuICAgICAgQ0hBUl9NSU5VUyA9PT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICBDSEFSX01JTlVTID09PSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSkgJiZcbiAgICAgIENIQVJfTUlOVVMgPT09IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAyKSkge1xuICAgIHN0YXRlLnBvc2l0aW9uICs9IDM7XG4gICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gIH0gZWxzZSBpZiAoaGFzRGlyZWN0aXZlcykge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdkaXJlY3RpdmVzIGVuZCBtYXJrIGlzIGV4cGVjdGVkJyk7XG4gIH1cblxuICBjb21wb3NlTm9kZShzdGF0ZSwgc3RhdGUubGluZUluZGVudCAtIDEsIENPTlRFWFRfQkxPQ0tfT1VULCBmYWxzZSwgdHJ1ZSk7XG4gIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcblxuICBpZiAoc3RhdGUuY2hlY2tMaW5lQnJlYWtzICYmXG4gICAgICBQQVRURVJOX05PTl9BU0NJSV9MSU5FX0JSRUFLUy50ZXN0KHN0YXRlLmlucHV0LnNsaWNlKGRvY3VtZW50U3RhcnQsIHN0YXRlLnBvc2l0aW9uKSkpIHtcbiAgICB0aHJvd1dhcm5pbmcoc3RhdGUsICdub24tQVNDSUkgbGluZSBicmVha3MgYXJlIGludGVycHJldGVkIGFzIGNvbnRlbnQnKTtcbiAgfVxuXG4gIGl0ZXJhdG9yKHN0YXRlLnJlc3VsdCk7XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiYgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSkge1xuICAgIGlmIChDSEFSX0RPVCA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbiArPSAzO1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdlbmQgb2YgdGhlIHN0cmVhbSBvciBhIGRvY3VtZW50IHNlcGFyYXRvciBpcyBleHBlY3RlZCcpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybjtcbiAgfVxufVxuXG5cblxuZnVuY3Rpb24gbG9hZEFsbChpbnB1dCwgaXRlcmF0b3IsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIHN0YXRlID0gbmV3IFN0YXRlKGlucHV0LCBvcHRpb25zKTtcblxuICBpZiAoUEFUVEVSTl9OT05fUFJJTlRBQkxFLnRlc3Qoc3RhdGUuaW5wdXQpKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RoZSBzdHJlYW0gY29udGFpbnMgbm9uLXByaW50YWJsZSBjaGFyYWN0ZXJzJyk7XG4gIH1cblxuICB3aGlsZSAoQ0hBUl9TUEFDRSA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgc3RhdGUubGluZUluZGVudCArPSAxO1xuICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIH1cblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICByZWFkRG9jdW1lbnQoc3RhdGUsIGl0ZXJhdG9yKTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGxvYWQoaW5wdXQsIG9wdGlvbnMpIHtcbiAgdmFyIHJlc3VsdCA9IG51bGwsIHJlY2VpdmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gaXRlcmF0b3IoZGF0YSkge1xuICAgIGlmICghcmVjZWl2ZWQpIHtcbiAgICAgIHJlc3VsdCA9IGRhdGE7XG4gICAgICByZWNlaXZlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdleHBlY3RlZCBhIHNpbmdsZSBkb2N1bWVudCBpbiB0aGUgc3RyZWFtLCBidXQgZm91bmQgbW9yZScpO1xuICAgIH1cbiAgfVxuXG4gIGxvYWRBbGwoaW5wdXQsIGl0ZXJhdG9yLCBvcHRpb25zKTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIHNhZmVMb2FkQWxsKGlucHV0LCBvdXRwdXQsIG9wdGlvbnMpIHtcbiAgbG9hZEFsbChpbnB1dCwgb3V0cHV0LCBjb21tb24uZXh0ZW5kKHsgc2NoZW1hOiBERUZBVUxUX1NBRkVfU0NIRU1BIH0sIG9wdGlvbnMpKTtcbn1cblxuXG5mdW5jdGlvbiBzYWZlTG9hZChpbnB1dCwgb3B0aW9ucykge1xuICByZXR1cm4gbG9hZChpbnB1dCwgY29tbW9uLmV4dGVuZCh7IHNjaGVtYTogREVGQVVMVF9TQUZFX1NDSEVNQSB9LCBvcHRpb25zKSk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMubG9hZEFsbCAgICAgPSBsb2FkQWxsO1xubW9kdWxlLmV4cG9ydHMubG9hZCAgICAgICAgPSBsb2FkO1xubW9kdWxlLmV4cG9ydHMuc2FmZUxvYWRBbGwgPSBzYWZlTG9hZEFsbDtcbm1vZHVsZS5leHBvcnRzLnNhZmVMb2FkICAgID0gc2FmZUxvYWQ7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIGNvbW1vbiA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XG5cblxuZnVuY3Rpb24gTWFyayhuYW1lLCBidWZmZXIsIHBvc2l0aW9uLCBsaW5lLCBjb2x1bW4pIHtcbiAgdGhpcy5uYW1lICAgICA9IG5hbWU7XG4gIHRoaXMuYnVmZmVyICAgPSBidWZmZXI7XG4gIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgdGhpcy5saW5lICAgICA9IGxpbmU7XG4gIHRoaXMuY29sdW1uICAgPSBjb2x1bW47XG59XG5cblxuTWFyay5wcm90b3R5cGUuZ2V0U25pcHBldCA9IGZ1bmN0aW9uIGdldFNuaXBwZXQoaW5kZW50LCBtYXhMZW5ndGgpIHtcbiAgdmFyIGhlYWQsIHN0YXJ0LCB0YWlsLCBlbmQsIHNuaXBwZXQ7XG5cbiAgaWYgKCF0aGlzLmJ1ZmZlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaW5kZW50ID0gaW5kZW50IHx8IDQ7XG4gIG1heExlbmd0aCA9IG1heExlbmd0aCB8fCA3NTtcblxuICBoZWFkID0gJyc7XG4gIHN0YXJ0ID0gdGhpcy5wb3NpdGlvbjtcblxuICB3aGlsZSAoc3RhcnQgPiAwICYmIC0xID09PSAnXFx4MDBcXHJcXG5cXHg4NVxcdTIwMjhcXHUyMDI5Jy5pbmRleE9mKHRoaXMuYnVmZmVyLmNoYXJBdChzdGFydCAtIDEpKSkge1xuICAgIHN0YXJ0IC09IDE7XG4gICAgaWYgKHRoaXMucG9zaXRpb24gLSBzdGFydCA+IChtYXhMZW5ndGggLyAyIC0gMSkpIHtcbiAgICAgIGhlYWQgPSAnIC4uLiAnO1xuICAgICAgc3RhcnQgKz0gNTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHRhaWwgPSAnJztcbiAgZW5kID0gdGhpcy5wb3NpdGlvbjtcblxuICB3aGlsZSAoZW5kIDwgdGhpcy5idWZmZXIubGVuZ3RoICYmIC0xID09PSAnXFx4MDBcXHJcXG5cXHg4NVxcdTIwMjhcXHUyMDI5Jy5pbmRleE9mKHRoaXMuYnVmZmVyLmNoYXJBdChlbmQpKSkge1xuICAgIGVuZCArPSAxO1xuICAgIGlmIChlbmQgLSB0aGlzLnBvc2l0aW9uID4gKG1heExlbmd0aCAvIDIgLSAxKSkge1xuICAgICAgdGFpbCA9ICcgLi4uICc7XG4gICAgICBlbmQgLT0gNTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHNuaXBwZXQgPSB0aGlzLmJ1ZmZlci5zbGljZShzdGFydCwgZW5kKTtcblxuICByZXR1cm4gY29tbW9uLnJlcGVhdCgnICcsIGluZGVudCkgKyBoZWFkICsgc25pcHBldCArIHRhaWwgKyAnXFxuJyArXG4gICAgICAgICBjb21tb24ucmVwZWF0KCcgJywgaW5kZW50ICsgdGhpcy5wb3NpdGlvbiAtIHN0YXJ0ICsgaGVhZC5sZW5ndGgpICsgJ14nO1xufTtcblxuXG5NYXJrLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKGNvbXBhY3QpIHtcbiAgdmFyIHNuaXBwZXQsIHdoZXJlID0gJyc7XG5cbiAgaWYgKHRoaXMubmFtZSkge1xuICAgIHdoZXJlICs9ICdpbiBcIicgKyB0aGlzLm5hbWUgKyAnXCIgJztcbiAgfVxuXG4gIHdoZXJlICs9ICdhdCBsaW5lICcgKyAodGhpcy5saW5lICsgMSkgKyAnLCBjb2x1bW4gJyArICh0aGlzLmNvbHVtbiArIDEpO1xuXG4gIGlmICghY29tcGFjdCkge1xuICAgIHNuaXBwZXQgPSB0aGlzLmdldFNuaXBwZXQoKTtcblxuICAgIGlmIChzbmlwcGV0KSB7XG4gICAgICB3aGVyZSArPSAnOlxcbicgKyBzbmlwcGV0O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB3aGVyZTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXJrO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBjb21tb24gICAgICAgID0gcmVxdWlyZSgnLi9jb21tb24nKTtcbnZhciBZQU1MRXhjZXB0aW9uID0gcmVxdWlyZSgnLi9leGNlcHRpb24nKTtcbnZhciBUeXBlICAgICAgICAgID0gcmVxdWlyZSgnLi90eXBlJyk7XG5cblxuZnVuY3Rpb24gY29tcGlsZUxpc3Qoc2NoZW1hLCBuYW1lLCByZXN1bHQpIHtcbiAgdmFyIGV4Y2x1ZGUgPSBbXTtcblxuICBzY2hlbWEuaW5jbHVkZS5mb3JFYWNoKGZ1bmN0aW9uIChpbmNsdWRlZFNjaGVtYSkge1xuICAgIHJlc3VsdCA9IGNvbXBpbGVMaXN0KGluY2x1ZGVkU2NoZW1hLCBuYW1lLCByZXN1bHQpO1xuICB9KTtcblxuICBzY2hlbWFbbmFtZV0uZm9yRWFjaChmdW5jdGlvbiAoY3VycmVudFR5cGUpIHtcbiAgICByZXN1bHQuZm9yRWFjaChmdW5jdGlvbiAocHJldmlvdXNUeXBlLCBwcmV2aW91c0luZGV4KSB7XG4gICAgICBpZiAocHJldmlvdXNUeXBlLnRhZyA9PT0gY3VycmVudFR5cGUudGFnKSB7XG4gICAgICAgIGV4Y2x1ZGUucHVzaChwcmV2aW91c0luZGV4KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJlc3VsdC5wdXNoKGN1cnJlbnRUeXBlKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdC5maWx0ZXIoZnVuY3Rpb24gKHR5cGUsIGluZGV4KSB7XG4gICAgcmV0dXJuIC0xID09PSBleGNsdWRlLmluZGV4T2YoaW5kZXgpO1xuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBjb21waWxlTWFwKC8qIGxpc3RzLi4uICovKSB7XG4gIHZhciByZXN1bHQgPSB7fSwgaW5kZXgsIGxlbmd0aDtcblxuICBmdW5jdGlvbiBjb2xsZWN0VHlwZSh0eXBlKSB7XG4gICAgcmVzdWx0W3R5cGUudGFnXSA9IHR5cGU7XG4gIH1cblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBhcmd1bWVudHNbaW5kZXhdLmZvckVhY2goY29sbGVjdFR5cGUpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBTY2hlbWEoZGVmaW5pdGlvbikge1xuICB0aGlzLmluY2x1ZGUgID0gZGVmaW5pdGlvbi5pbmNsdWRlICB8fCBbXTtcbiAgdGhpcy5pbXBsaWNpdCA9IGRlZmluaXRpb24uaW1wbGljaXQgfHwgW107XG4gIHRoaXMuZXhwbGljaXQgPSBkZWZpbml0aW9uLmV4cGxpY2l0IHx8IFtdO1xuXG4gIHRoaXMuaW1wbGljaXQuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIGlmICh0eXBlLmxvYWRLaW5kICYmICdzY2FsYXInICE9PSB0eXBlLmxvYWRLaW5kKSB7XG4gICAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignVGhlcmUgaXMgYSBub24tc2NhbGFyIHR5cGUgaW4gdGhlIGltcGxpY2l0IGxpc3Qgb2YgYSBzY2hlbWEuIEltcGxpY2l0IHJlc29sdmluZyBvZiBzdWNoIHR5cGVzIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgfVxuICB9KTtcblxuICB0aGlzLmNvbXBpbGVkSW1wbGljaXQgPSBjb21waWxlTGlzdCh0aGlzLCAnaW1wbGljaXQnLCBbXSk7XG4gIHRoaXMuY29tcGlsZWRFeHBsaWNpdCA9IGNvbXBpbGVMaXN0KHRoaXMsICdleHBsaWNpdCcsIFtdKTtcbiAgdGhpcy5jb21waWxlZFR5cGVNYXAgID0gY29tcGlsZU1hcCh0aGlzLmNvbXBpbGVkSW1wbGljaXQsIHRoaXMuY29tcGlsZWRFeHBsaWNpdCk7XG59XG5cblxuU2NoZW1hLkRFRkFVTFQgPSBudWxsO1xuXG5cblNjaGVtYS5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGVTY2hlbWEoKSB7XG4gIHZhciBzY2hlbWFzLCB0eXBlcztcblxuICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgY2FzZSAxOlxuICAgIHNjaGVtYXMgPSBTY2hlbWEuREVGQVVMVDtcbiAgICB0eXBlcyA9IGFyZ3VtZW50c1swXTtcbiAgICBicmVhaztcblxuICBjYXNlIDI6XG4gICAgc2NoZW1hcyA9IGFyZ3VtZW50c1swXTtcbiAgICB0eXBlcyA9IGFyZ3VtZW50c1sxXTtcbiAgICBicmVhaztcblxuICBkZWZhdWx0OlxuICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdXcm9uZyBudW1iZXIgb2YgYXJndW1lbnRzIGZvciBTY2hlbWEuY3JlYXRlIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBzY2hlbWFzID0gY29tbW9uLnRvQXJyYXkoc2NoZW1hcyk7XG4gIHR5cGVzID0gY29tbW9uLnRvQXJyYXkodHlwZXMpO1xuXG4gIGlmICghc2NoZW1hcy5ldmVyeShmdW5jdGlvbiAoc2NoZW1hKSB7IHJldHVybiBzY2hlbWEgaW5zdGFuY2VvZiBTY2hlbWE7IH0pKSB7XG4gICAgdGhyb3cgbmV3IFlBTUxFeGNlcHRpb24oJ1NwZWNpZmllZCBsaXN0IG9mIHN1cGVyIHNjaGVtYXMgKG9yIGEgc2luZ2xlIFNjaGVtYSBvYmplY3QpIGNvbnRhaW5zIGEgbm9uLVNjaGVtYSBvYmplY3QuJyk7XG4gIH1cblxuICBpZiAoIXR5cGVzLmV2ZXJ5KGZ1bmN0aW9uICh0eXBlKSB7IHJldHVybiB0eXBlIGluc3RhbmNlb2YgVHlwZTsgfSkpIHtcbiAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignU3BlY2lmaWVkIGxpc3Qgb2YgWUFNTCB0eXBlcyAob3IgYSBzaW5nbGUgVHlwZSBvYmplY3QpIGNvbnRhaW5zIGEgbm9uLVR5cGUgb2JqZWN0LicpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBTY2hlbWEoe1xuICAgIGluY2x1ZGU6IHNjaGVtYXMsXG4gICAgZXhwbGljaXQ6IHR5cGVzXG4gIH0pO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjaGVtYTtcbiIsIi8vIFN0YW5kYXJkIFlBTUwncyBDb3JlIHNjaGVtYS5cbi8vIGh0dHA6Ly93d3cueWFtbC5vcmcvc3BlYy8xLjIvc3BlYy5odG1sI2lkMjgwNDkyM1xuLy9cbi8vIE5PVEU6IEpTLVlBTUwgZG9lcyBub3Qgc3VwcG9ydCBzY2hlbWEtc3BlY2lmaWMgdGFnIHJlc29sdXRpb24gcmVzdHJpY3Rpb25zLlxuLy8gU28sIENvcmUgc2NoZW1hIGhhcyBubyBkaXN0aW5jdGlvbnMgZnJvbSBKU09OIHNjaGVtYSBpcyBKUy1ZQU1MLlxuXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgU2NoZW1hID0gcmVxdWlyZSgnLi4vc2NoZW1hJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgU2NoZW1hKHtcbiAgaW5jbHVkZTogW1xuICAgIHJlcXVpcmUoJy4vanNvbicpXG4gIF1cbn0pO1xuIiwiLy8gSlMtWUFNTCdzIGRlZmF1bHQgc2NoZW1hIGZvciBgbG9hZGAgZnVuY3Rpb24uXG4vLyBJdCBpcyBub3QgZGVzY3JpYmVkIGluIHRoZSBZQU1MIHNwZWNpZmljYXRpb24uXG4vL1xuLy8gVGhpcyBzY2hlbWEgaXMgYmFzZWQgb24gSlMtWUFNTCdzIGRlZmF1bHQgc2FmZSBzY2hlbWEgYW5kIGluY2x1ZGVzXG4vLyBKYXZhU2NyaXB0LXNwZWNpZmljIHR5cGVzOiAhIWpzL3VuZGVmaW5lZCwgISFqcy9yZWdleHAgYW5kICEhanMvZnVuY3Rpb24uXG4vL1xuLy8gQWxzbyB0aGlzIHNjaGVtYSBpcyB1c2VkIGFzIGRlZmF1bHQgYmFzZSBzY2hlbWEgYXQgYFNjaGVtYS5jcmVhdGVgIGZ1bmN0aW9uLlxuXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgU2NoZW1hID0gcmVxdWlyZSgnLi4vc2NoZW1hJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBTY2hlbWEuREVGQVVMVCA9IG5ldyBTY2hlbWEoe1xuICBpbmNsdWRlOiBbXG4gICAgcmVxdWlyZSgnLi9kZWZhdWx0X3NhZmUnKVxuICBdLFxuICBleHBsaWNpdDogW1xuICAgIHJlcXVpcmUoJy4uL3R5cGUvanMvdW5kZWZpbmVkJyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9qcy9yZWdleHAnKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL2pzL2Z1bmN0aW9uJylcbiAgXVxufSk7XG4iLCIvLyBKUy1ZQU1MJ3MgZGVmYXVsdCBzY2hlbWEgZm9yIGBzYWZlTG9hZGAgZnVuY3Rpb24uXG4vLyBJdCBpcyBub3QgZGVzY3JpYmVkIGluIHRoZSBZQU1MIHNwZWNpZmljYXRpb24uXG4vL1xuLy8gVGhpcyBzY2hlbWEgaXMgYmFzZWQgb24gc3RhbmRhcmQgWUFNTCdzIENvcmUgc2NoZW1hIGFuZCBpbmNsdWRlcyBtb3N0IG9mXG4vLyBleHRyYSB0eXBlcyBkZXNjcmliZWQgYXQgWUFNTCB0YWcgcmVwb3NpdG9yeS4gKGh0dHA6Ly95YW1sLm9yZy90eXBlLylcblxuXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFNjaGVtYSA9IHJlcXVpcmUoJy4uL3NjaGVtYScpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNjaGVtYSh7XG4gIGluY2x1ZGU6IFtcbiAgICByZXF1aXJlKCcuL2NvcmUnKVxuICBdLFxuICBpbXBsaWNpdDogW1xuICAgIHJlcXVpcmUoJy4uL3R5cGUvdGltZXN0YW1wJyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9tZXJnZScpXG4gIF0sXG4gIGV4cGxpY2l0OiBbXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9iaW5hcnknKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL29tYXAnKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL3BhaXJzJyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9zZXQnKVxuICBdXG59KTtcbiIsIi8vIFN0YW5kYXJkIFlBTUwncyBGYWlsc2FmZSBzY2hlbWEuXG4vLyBodHRwOi8vd3d3LnlhbWwub3JnL3NwZWMvMS4yL3NwZWMuaHRtbCNpZDI4MDIzNDZcblxuXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFNjaGVtYSA9IHJlcXVpcmUoJy4uL3NjaGVtYScpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNjaGVtYSh7XG4gIGV4cGxpY2l0OiBbXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9zdHInKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL3NlcScpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvbWFwJylcbiAgXVxufSk7XG4iLCIvLyBTdGFuZGFyZCBZQU1MJ3MgSlNPTiBzY2hlbWEuXG4vLyBodHRwOi8vd3d3LnlhbWwub3JnL3NwZWMvMS4yL3NwZWMuaHRtbCNpZDI4MDMyMzFcbi8vXG4vLyBOT1RFOiBKUy1ZQU1MIGRvZXMgbm90IHN1cHBvcnQgc2NoZW1hLXNwZWNpZmljIHRhZyByZXNvbHV0aW9uIHJlc3RyaWN0aW9ucy5cbi8vIFNvLCB0aGlzIHNjaGVtYSBpcyBub3Qgc3VjaCBzdHJpY3QgYXMgZGVmaW5lZCBpbiB0aGUgWUFNTCBzcGVjaWZpY2F0aW9uLlxuLy8gSXQgYWxsb3dzIG51bWJlcnMgaW4gYmluYXJ5IG5vdGFpb24sIHVzZSBgTnVsbGAgYW5kIGBOVUxMYCBhcyBgbnVsbGAsIGV0Yy5cblxuXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFNjaGVtYSA9IHJlcXVpcmUoJy4uL3NjaGVtYScpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNjaGVtYSh7XG4gIGluY2x1ZGU6IFtcbiAgICByZXF1aXJlKCcuL2ZhaWxzYWZlJylcbiAgXSxcbiAgaW1wbGljaXQ6IFtcbiAgICByZXF1aXJlKCcuLi90eXBlL251bGwnKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL2Jvb2wnKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL2ludCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvZmxvYXQnKVxuICBdXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgWUFNTEV4Y2VwdGlvbiA9IHJlcXVpcmUoJy4vZXhjZXB0aW9uJyk7XG5cblxudmFyIFRZUEVfQ09OU1RSVUNUT1JfT1BUSU9OUyA9IFtcbiAgJ2xvYWRLaW5kJyxcbiAgJ2xvYWRSZXNvbHZlcicsXG4gICdkdW1wSW5zdGFuY2VPZicsXG4gICdkdW1wUHJlZGljYXRlJyxcbiAgJ2R1bXBSZXByZXNlbnRlcicsXG4gICdkdW1wRGVmYXVsdFN0eWxlJyxcbiAgJ2R1bXBTdHlsZUFsaWFzZXMnXG5dO1xuXG5cbnZhciBZQU1MX05PREVfS0lORFMgPSBbXG4gICdzY2FsYXInLFxuICAnc2VxdWVuY2UnLFxuICAnbWFwcGluZydcbl07XG5cblxuZnVuY3Rpb24gY29tcGlsZVN0eWxlQWxpYXNlcyhtYXApIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuXG4gIGlmIChudWxsICE9PSBtYXApIHtcbiAgICBPYmplY3Qua2V5cyhtYXApLmZvckVhY2goZnVuY3Rpb24gKHN0eWxlKSB7XG4gICAgICBtYXBbc3R5bGVdLmZvckVhY2goZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHJlc3VsdFtTdHJpbmcoYWxpYXMpXSA9IHN0eWxlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIFR5cGUodGFnLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAoLTEgPT09IFRZUEVfQ09OU1RSVUNUT1JfT1BUSU9OUy5pbmRleE9mKG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignVW5rbm93biBvcHRpb24gXCInICsgbmFtZSArICdcIiBpcyBtZXQgaW4gZGVmaW5pdGlvbiBvZiBcIicgKyB0YWcgKyAnXCIgWUFNTCB0eXBlLicpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gVE9ETzogQWRkIHRhZyBmb3JtYXQgY2hlY2suXG4gIHRoaXMudGFnICAgICAgICAgICAgICA9IHRhZztcbiAgdGhpcy5sb2FkS2luZCAgICAgICAgID0gb3B0aW9uc1snbG9hZEtpbmQnXSAgICAgICAgIHx8IG51bGw7XG4gIHRoaXMubG9hZFJlc29sdmVyICAgICA9IG9wdGlvbnNbJ2xvYWRSZXNvbHZlciddICAgICB8fCBudWxsO1xuICB0aGlzLmR1bXBJbnN0YW5jZU9mICAgPSBvcHRpb25zWydkdW1wSW5zdGFuY2VPZiddICAgfHwgbnVsbDtcbiAgdGhpcy5kdW1wUHJlZGljYXRlICAgID0gb3B0aW9uc1snZHVtcFByZWRpY2F0ZSddICAgIHx8IG51bGw7XG4gIHRoaXMuZHVtcFJlcHJlc2VudGVyICA9IG9wdGlvbnNbJ2R1bXBSZXByZXNlbnRlciddICB8fCBudWxsO1xuICB0aGlzLmR1bXBEZWZhdWx0U3R5bGUgPSBvcHRpb25zWydkdW1wRGVmYXVsdFN0eWxlJ10gfHwgbnVsbDtcbiAgdGhpcy5kdW1wU3R5bGVBbGlhc2VzID0gY29tcGlsZVN0eWxlQWxpYXNlcyhvcHRpb25zWydkdW1wU3R5bGVBbGlhc2VzJ10gfHwgbnVsbCk7XG5cbiAgaWYgKC0xID09PSBZQU1MX05PREVfS0lORFMuaW5kZXhPZih0aGlzLmxvYWRLaW5kKSkge1xuICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdVbmtub3duIGxvYWRLaW5kIFwiJyArIHRoaXMubG9hZEtpbmQgKyAnXCIgaXMgc3BlY2lmaWVkIGZvciBcIicgKyB0YWcgKyAnXCIgWUFNTCB0eXBlLicpO1xuICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBUeXBlO1xuIiwiLy8gTW9kaWZpZWQgZnJvbTpcbi8vIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20va2FuYWthL25vVk5DL2Q4OTBlODY0MGYyMGZiYTMyMTViYTdiZThlMGZmMTQ1YWViOGMxN2MvaW5jbHVkZS9iYXNlNjQuanNcblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBBIHRyaWNrIGZvciBicm93c2VyaWZpZWQgdmVyc2lvbi5cbi8vIFNpbmNlIHdlIG1ha2UgYnJvd3NlcmlmaWVyIHRvIGlnbm9yZSBgYnVmZmVyYCBtb2R1bGUsIE5vZGVCdWZmZXIgd2lsbCBiZSB1bmRlZmluZWRcbnZhciBOb2RlQnVmZmVyID0gcmVxdWlyZSgnYnVmZmVyJykuQnVmZmVyO1xuXG52YXIgVHlwZSAgICAgICA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG5cbnZhciBCQVNFNjRfUEFERElORyA9ICc9JztcblxudmFyIEJBU0U2NF9CSU5UQUJMRSA9IFtcbiAgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsXG4gIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLFxuICAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIDYyLCAtMSwgLTEsIC0xLCA2MyxcbiAgNTIsIDUzLCA1NCwgNTUsIDU2LCA1NywgNTgsIDU5LCA2MCwgNjEsIC0xLCAtMSwgLTEsICAwLCAtMSwgLTEsXG4gIC0xLCAgMCwgIDEsICAyLCAgMywgIDQsICA1LCAgNiwgIDcsICA4LCAgOSwgMTAsIDExLCAxMiwgMTMsIDE0LFxuICAxNSwgMTYsIDE3LCAxOCwgMTksIDIwLCAyMSwgMjIsIDIzLCAyNCwgMjUsIC0xLCAtMSwgLTEsIC0xLCAtMSxcbiAgLTEsIDI2LCAyNywgMjgsIDI5LCAzMCwgMzEsIDMyLCAzMywgMzQsIDM1LCAzNiwgMzcsIDM4LCAzOSwgNDAsXG4gIDQxLCA0MiwgNDMsIDQ0LCA0NSwgNDYsIDQ3LCA0OCwgNDksIDUwLCA1MSwgLTEsIC0xLCAtMSwgLTEsIC0xXG5dO1xuXG52YXIgQkFTRTY0X0NIQVJUQUJMRSA9XG4gICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJy5zcGxpdCgnJyk7XG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxCaW5hcnkoc3RhdGUpIHtcbiAgdmFyIHZhbHVlLCBjb2RlLCBpZHggPSAwLCByZXN1bHQgPSBbXSwgbGVmdGJpdHMsIGxlZnRkYXRhLFxuICAgICAgb2JqZWN0ID0gc3RhdGUucmVzdWx0O1xuXG4gIGxlZnRiaXRzID0gMDsgLy8gbnVtYmVyIG9mIGJpdHMgZGVjb2RlZCwgYnV0IHlldCB0byBiZSBhcHBlbmRlZFxuICBsZWZ0ZGF0YSA9IDA7IC8vIGJpdHMgZGVjb2RlZCwgYnV0IHlldCB0byBiZSBhcHBlbmRlZFxuXG4gIC8vIENvbnZlcnQgb25lIGJ5IG9uZS5cbiAgZm9yIChpZHggPSAwOyBpZHggPCBvYmplY3QubGVuZ3RoOyBpZHggKz0gMSkge1xuICAgIGNvZGUgPSBvYmplY3QuY2hhckNvZGVBdChpZHgpO1xuICAgIHZhbHVlID0gQkFTRTY0X0JJTlRBQkxFW2NvZGUgJiAweDdGXTtcblxuICAgIC8vIFNraXAgTEYoTkwpIHx8IENSXG4gICAgaWYgKDB4MEEgIT09IGNvZGUgJiYgMHgwRCAhPT0gY29kZSkge1xuICAgICAgLy8gRmFpbCBvbiBpbGxlZ2FsIGNoYXJhY3RlcnNcbiAgICAgIGlmICgtMSA9PT0gdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBDb2xsZWN0IGRhdGEgaW50byBsZWZ0ZGF0YSwgdXBkYXRlIGJpdGNvdW50XG4gICAgICBsZWZ0ZGF0YSA9IChsZWZ0ZGF0YSA8PCA2KSB8IHZhbHVlO1xuICAgICAgbGVmdGJpdHMgKz0gNjtcblxuICAgICAgLy8gSWYgd2UgaGF2ZSA4IG9yIG1vcmUgYml0cywgYXBwZW5kIDggYml0cyB0byB0aGUgcmVzdWx0XG4gICAgICBpZiAobGVmdGJpdHMgPj0gOCkge1xuICAgICAgICBsZWZ0Yml0cyAtPSA4O1xuXG4gICAgICAgIC8vIEFwcGVuZCBpZiBub3QgcGFkZGluZy5cbiAgICAgICAgaWYgKEJBU0U2NF9QQURESU5HICE9PSBvYmplY3QuY2hhckF0KGlkeCkpIHtcbiAgICAgICAgICByZXN1bHQucHVzaCgobGVmdGRhdGEgPj4gbGVmdGJpdHMpICYgMHhGRik7XG4gICAgICAgIH1cblxuICAgICAgICBsZWZ0ZGF0YSAmPSAoMSA8PCBsZWZ0Yml0cykgLSAxO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIHRoZXJlIGFyZSBhbnkgYml0cyBsZWZ0LCB0aGUgYmFzZTY0IHN0cmluZyB3YXMgY29ycnVwdGVkXG4gIGlmIChsZWZ0Yml0cykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXcmFwIGludG8gQnVmZmVyIGZvciBOb2RlSlMgYW5kIGxlYXZlIEFycmF5IGZvciBicm93c2VyXG4gICAgaWYgKE5vZGVCdWZmZXIpIHtcbiAgICAgIHN0YXRlLnJlc3VsdCA9IG5ldyBOb2RlQnVmZmVyKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnJlc3VsdCA9IHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiByZXByZXNlbnRZYW1sQmluYXJ5KG9iamVjdCAvKiwgc3R5bGUqLykge1xuICB2YXIgcmVzdWx0ID0gJycsIGluZGV4LCBsZW5ndGgsIHJlc3Q7XG5cbiAgLy8gQ29udmVydCBldmVyeSB0aHJlZSBieXRlcyB0byA0IEFTQ0lJIGNoYXJhY3RlcnMuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoIC0gMjsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDMpIHtcbiAgICByZXN1bHQgKz0gQkFTRTY0X0NIQVJUQUJMRVtvYmplY3RbaW5kZXggKyAwXSA+PiAyXTtcbiAgICByZXN1bHQgKz0gQkFTRTY0X0NIQVJUQUJMRVsoKG9iamVjdFtpbmRleCArIDBdICYgMHgwMykgPDwgNCkgKyAob2JqZWN0W2luZGV4ICsgMV0gPj4gNCldO1xuICAgIHJlc3VsdCArPSBCQVNFNjRfQ0hBUlRBQkxFWygob2JqZWN0W2luZGV4ICsgMV0gJiAweDBGKSA8PCAyKSArIChvYmplY3RbaW5kZXggKyAyXSA+PiA2KV07XG4gICAgcmVzdWx0ICs9IEJBU0U2NF9DSEFSVEFCTEVbb2JqZWN0W2luZGV4ICsgMl0gJiAweDNGXTtcbiAgfVxuXG4gIHJlc3QgPSBvYmplY3QubGVuZ3RoICUgMztcblxuICAvLyBDb252ZXJ0IHRoZSByZW1haW5pbmcgMSBvciAyIGJ5dGVzLCBwYWRkaW5nIG91dCB0byA0IGNoYXJhY3RlcnMuXG4gIGlmICgwICE9PSByZXN0KSB7XG4gICAgaW5kZXggPSBvYmplY3QubGVuZ3RoIC0gcmVzdDtcbiAgICByZXN1bHQgKz0gQkFTRTY0X0NIQVJUQUJMRVtvYmplY3RbaW5kZXggKyAwXSA+PiAyXTtcblxuICAgIGlmICgyID09PSByZXN0KSB7XG4gICAgICByZXN1bHQgKz0gQkFTRTY0X0NIQVJUQUJMRVsoKG9iamVjdFtpbmRleCArIDBdICYgMHgwMykgPDwgNCkgKyAob2JqZWN0W2luZGV4ICsgMV0gPj4gNCldO1xuICAgICAgcmVzdWx0ICs9IEJBU0U2NF9DSEFSVEFCTEVbKG9iamVjdFtpbmRleCArIDFdICYgMHgwRikgPDwgMl07XG4gICAgICByZXN1bHQgKz0gQkFTRTY0X1BBRERJTkc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSBCQVNFNjRfQ0hBUlRBQkxFWyhvYmplY3RbaW5kZXggKyAwXSAmIDB4MDMpIDw8IDRdO1xuICAgICAgcmVzdWx0ICs9IEJBU0U2NF9QQURESU5HICsgQkFTRTY0X1BBRERJTkc7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBpc0JpbmFyeShvYmplY3QpIHtcbiAgcmV0dXJuIE5vZGVCdWZmZXIgJiYgTm9kZUJ1ZmZlci5pc0J1ZmZlcihvYmplY3QpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOmJpbmFyeScsIHtcbiAgbG9hZEtpbmQ6ICdzY2FsYXInLFxuICBsb2FkUmVzb2x2ZXI6IHJlc29sdmVZYW1sQmluYXJ5LFxuICBkdW1wUHJlZGljYXRlOiBpc0JpbmFyeSxcbiAgZHVtcFJlcHJlc2VudGVyOiByZXByZXNlbnRZYW1sQmluYXJ5XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG52YXIgWUFNTF9JTVBMSUNJVF9CT09MRUFOX01BUCA9IHtcbiAgJ3RydWUnICA6IHRydWUsXG4gICdUcnVlJyAgOiB0cnVlLFxuICAnVFJVRScgIDogdHJ1ZSxcbiAgJ2ZhbHNlJyA6IGZhbHNlLFxuICAnRmFsc2UnIDogZmFsc2UsXG4gICdGQUxTRScgOiBmYWxzZVxufTtcblxuLyp2YXIgWUFNTF9FWFBMSUNJVF9CT09MRUFOX01BUCA9IHtcbiAgJ3RydWUnICA6IHRydWUsXG4gICdUcnVlJyAgOiB0cnVlLFxuICAnVFJVRScgIDogdHJ1ZSxcbiAgJ2ZhbHNlJyA6IGZhbHNlLFxuICAnRmFsc2UnIDogZmFsc2UsXG4gICdGQUxTRScgOiBmYWxzZSxcbiAgJ3knICAgICA6IHRydWUsXG4gICdZJyAgICAgOiB0cnVlLFxuICAneWVzJyAgIDogdHJ1ZSxcbiAgJ1llcycgICA6IHRydWUsXG4gICdZRVMnICAgOiB0cnVlLFxuICAnbicgICAgIDogZmFsc2UsXG4gICdOJyAgICAgOiBmYWxzZSxcbiAgJ25vJyAgICA6IGZhbHNlLFxuICAnTm8nICAgIDogZmFsc2UsXG4gICdOTycgICAgOiBmYWxzZSxcbiAgJ29uJyAgICA6IHRydWUsXG4gICdPbicgICAgOiB0cnVlLFxuICAnT04nICAgIDogdHJ1ZSxcbiAgJ29mZicgICA6IGZhbHNlLFxuICAnT2ZmJyAgIDogZmFsc2UsXG4gICdPRkYnICAgOiBmYWxzZVxufTsqL1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sQm9vbGVhbihzdGF0ZSkge1xuICBpZiAoWUFNTF9JTVBMSUNJVF9CT09MRUFOX01BUC5oYXNPd25Qcm9wZXJ0eShzdGF0ZS5yZXN1bHQpKSB7XG4gICAgc3RhdGUucmVzdWx0ID0gWUFNTF9JTVBMSUNJVF9CT09MRUFOX01BUFtzdGF0ZS5yZXN1bHRdO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihvYmplY3QpIHtcbiAgcmV0dXJuICdbb2JqZWN0IEJvb2xlYW5dJyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6Ym9vbCcsIHtcbiAgbG9hZEtpbmQ6ICdzY2FsYXInLFxuICBsb2FkUmVzb2x2ZXI6IHJlc29sdmVZYW1sQm9vbGVhbixcbiAgZHVtcFByZWRpY2F0ZTogaXNCb29sZWFuLFxuICBkdW1wUmVwcmVzZW50ZXI6IHtcbiAgICBsb3dlcmNhc2U6IGZ1bmN0aW9uIChvYmplY3QpIHsgcmV0dXJuIG9iamVjdCA/ICd0cnVlJyA6ICdmYWxzZSc7IH0sXG4gICAgdXBwZXJjYXNlOiBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiBvYmplY3QgPyAnVFJVRScgOiAnRkFMU0UnOyB9LFxuICAgIGNhbWVsY2FzZTogZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4gb2JqZWN0ID8gJ1RydWUnIDogJ0ZhbHNlJzsgfVxuICB9LFxuICBkdW1wRGVmYXVsdFN0eWxlOiAnbG93ZXJjYXNlJ1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxudmFyIFlBTUxfRkxPQVRfUEFUVEVSTiA9IG5ldyBSZWdFeHAoXG4gICdeKD86Wy0rXT8oPzpbMC05XVswLTlfXSopXFxcXC5bMC05X10qKD86W2VFXVstK11bMC05XSspPycgK1xuICAnfFxcXFwuWzAtOV9dKyg/OltlRV1bLStdWzAtOV0rKT8nICtcbiAgJ3xbLStdP1swLTldWzAtOV9dKig/OjpbMC01XT9bMC05XSkrXFxcXC5bMC05X10qJyArXG4gICd8Wy0rXT9cXFxcLig/OmluZnxJbmZ8SU5GKScgK1xuICAnfFxcXFwuKD86bmFufE5hTnxOQU4pKSQnKTtcblxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbEZsb2F0KHN0YXRlKSB7XG4gIHZhciB2YWx1ZSwgc2lnbiwgYmFzZSwgZGlnaXRzLFxuICAgICAgb2JqZWN0ID0gc3RhdGUucmVzdWx0O1xuXG4gIGlmICghWUFNTF9GTE9BVF9QQVRURVJOLnRlc3Qob2JqZWN0KSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHZhbHVlICA9IG9iamVjdC5yZXBsYWNlKC9fL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuICBzaWduICAgPSAnLScgPT09IHZhbHVlWzBdID8gLTEgOiAxO1xuICBkaWdpdHMgPSBbXTtcblxuICBpZiAoMCA8PSAnKy0nLmluZGV4T2YodmFsdWVbMF0pKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgxKTtcbiAgfVxuXG4gIGlmICgnLmluZicgPT09IHZhbHVlKSB7XG4gICAgc3RhdGUucmVzdWx0ID0gKDEgPT09IHNpZ24pID8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZIDogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoJy5uYW4nID09PSB2YWx1ZSkge1xuICAgIHN0YXRlLnJlc3VsdCA9IE5hTjtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKDAgPD0gdmFsdWUuaW5kZXhPZignOicpKSB7XG4gICAgdmFsdWUuc3BsaXQoJzonKS5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICBkaWdpdHMudW5zaGlmdChwYXJzZUZsb2F0KHYsIDEwKSk7XG4gICAgfSk7XG5cbiAgICB2YWx1ZSA9IDAuMDtcbiAgICBiYXNlID0gMTtcblxuICAgIGRpZ2l0cy5mb3JFYWNoKGZ1bmN0aW9uIChkKSB7XG4gICAgICB2YWx1ZSArPSBkICogYmFzZTtcbiAgICAgIGJhc2UgKj0gNjA7XG4gICAgfSk7XG5cbiAgICBzdGF0ZS5yZXN1bHQgPSBzaWduICogdmFsdWU7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSBzaWduICogcGFyc2VGbG9hdCh2YWx1ZSwgMTApO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cblxuZnVuY3Rpb24gcmVwcmVzZW50WWFtbEZsb2F0KG9iamVjdCwgc3R5bGUpIHtcbiAgaWYgKGlzTmFOKG9iamVjdCkpIHtcbiAgICBzd2l0Y2ggKHN0eWxlKSB7XG4gICAgY2FzZSAnbG93ZXJjYXNlJzpcbiAgICAgIHJldHVybiAnLm5hbic7XG4gICAgY2FzZSAndXBwZXJjYXNlJzpcbiAgICAgIHJldHVybiAnLk5BTic7XG4gICAgY2FzZSAnY2FtZWxjYXNlJzpcbiAgICAgIHJldHVybiAnLk5hTic7XG4gICAgfVxuICB9IGVsc2UgaWYgKE51bWJlci5QT1NJVElWRV9JTkZJTklUWSA9PT0gb2JqZWN0KSB7XG4gICAgc3dpdGNoIChzdHlsZSkge1xuICAgIGNhc2UgJ2xvd2VyY2FzZSc6XG4gICAgICByZXR1cm4gJy5pbmYnO1xuICAgIGNhc2UgJ3VwcGVyY2FzZSc6XG4gICAgICByZXR1cm4gJy5JTkYnO1xuICAgIGNhc2UgJ2NhbWVsY2FzZSc6XG4gICAgICByZXR1cm4gJy5JbmYnO1xuICAgIH1cbiAgfSBlbHNlIGlmIChOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFkgPT09IG9iamVjdCkge1xuICAgIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlICdsb3dlcmNhc2UnOlxuICAgICAgcmV0dXJuICctLmluZic7XG4gICAgY2FzZSAndXBwZXJjYXNlJzpcbiAgICAgIHJldHVybiAnLS5JTkYnO1xuICAgIGNhc2UgJ2NhbWVsY2FzZSc6XG4gICAgICByZXR1cm4gJy0uSW5mJztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iamVjdC50b1N0cmluZygxMCk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBpc0Zsb2F0KG9iamVjdCkge1xuICByZXR1cm4gKCdbb2JqZWN0IE51bWJlcl0nID09PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSkgJiZcbiAgICAgICAgICgwICE9PSBvYmplY3QgJSAxKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpmbG9hdCcsIHtcbiAgbG9hZEtpbmQ6ICdzY2FsYXInLFxuICBsb2FkUmVzb2x2ZXI6IHJlc29sdmVZYW1sRmxvYXQsXG4gIGR1bXBQcmVkaWNhdGU6IGlzRmxvYXQsXG4gIGR1bXBSZXByZXNlbnRlcjogcmVwcmVzZW50WWFtbEZsb2F0LFxuICBkdW1wRGVmYXVsdFN0eWxlOiAnbG93ZXJjYXNlJ1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxudmFyIFlBTUxfSU5URUdFUl9QQVRURVJOID0gbmV3IFJlZ0V4cChcbiAgJ14oPzpbLStdPzBiWzAtMV9dKycgK1xuICAnfFstK10/MFswLTdfXSsnICtcbiAgJ3xbLStdPyg/OjB8WzEtOV1bMC05X10qKScgK1xuICAnfFstK10/MHhbMC05YS1mQS1GX10rJyArXG4gICd8Wy0rXT9bMS05XVswLTlfXSooPzo6WzAtNV0/WzAtOV0pKykkJyk7XG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxJbnRlZ2VyKHN0YXRlKSB7XG4gIHZhciB2YWx1ZSwgc2lnbiwgYmFzZSwgZGlnaXRzLFxuICAgICAgb2JqZWN0ID0gc3RhdGUucmVzdWx0O1xuXG4gIGlmICghWUFNTF9JTlRFR0VSX1BBVFRFUk4udGVzdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFsdWUgID0gb2JqZWN0LnJlcGxhY2UoL18vZywgJycpO1xuICBzaWduICAgPSAnLScgPT09IHZhbHVlWzBdID8gLTEgOiAxO1xuICBkaWdpdHMgPSBbXTtcblxuICBpZiAoMCA8PSAnKy0nLmluZGV4T2YodmFsdWVbMF0pKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgxKTtcbiAgfVxuXG4gIGlmICgnMCcgPT09IHZhbHVlKSB7XG4gICAgc3RhdGUucmVzdWx0ID0gMDtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKC9eMGIvLnRlc3QodmFsdWUpKSB7XG4gICAgc3RhdGUucmVzdWx0ID0gc2lnbiAqIHBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCAyKTtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKC9eMHgvLnRlc3QodmFsdWUpKSB7XG4gICAgc3RhdGUucmVzdWx0ID0gc2lnbiAqIHBhcnNlSW50KHZhbHVlLCAxNik7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICgnMCcgPT09IHZhbHVlWzBdKSB7XG4gICAgc3RhdGUucmVzdWx0ID0gc2lnbiAqIHBhcnNlSW50KHZhbHVlLCA4KTtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKDAgPD0gdmFsdWUuaW5kZXhPZignOicpKSB7XG4gICAgdmFsdWUuc3BsaXQoJzonKS5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICBkaWdpdHMudW5zaGlmdChwYXJzZUludCh2LCAxMCkpO1xuICAgIH0pO1xuXG4gICAgdmFsdWUgPSAwO1xuICAgIGJhc2UgPSAxO1xuXG4gICAgZGlnaXRzLmZvckVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgIHZhbHVlICs9IChkICogYmFzZSk7XG4gICAgICBiYXNlICo9IDYwO1xuICAgIH0pO1xuXG4gICAgc3RhdGUucmVzdWx0ID0gc2lnbiAqIHZhbHVlO1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSB7XG4gICAgc3RhdGUucmVzdWx0ID0gc2lnbiAqIHBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBpc0ludGVnZXIob2JqZWN0KSB7XG4gIHJldHVybiAoJ1tvYmplY3QgTnVtYmVyXScgPT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpKSAmJlxuICAgICAgICAgKDAgPT09IG9iamVjdCAlIDEpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOmludCcsIHtcbiAgbG9hZEtpbmQ6ICdzY2FsYXInLFxuICBsb2FkUmVzb2x2ZXI6IHJlc29sdmVZYW1sSW50ZWdlcixcbiAgZHVtcFByZWRpY2F0ZTogaXNJbnRlZ2VyLFxuICBkdW1wUmVwcmVzZW50ZXI6IHtcbiAgICBiaW5hcnk6ICAgICAgZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4gJzBiJyArIG9iamVjdC50b1N0cmluZygyKTsgfSxcbiAgICBvY3RhbDogICAgICAgZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4gJzAnICArIG9iamVjdC50b1N0cmluZyg4KTsgfSxcbiAgICBkZWNpbWFsOiAgICAgZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4gICAgICAgIG9iamVjdC50b1N0cmluZygxMCk7IH0sXG4gICAgaGV4YWRlY2ltYWw6IGZ1bmN0aW9uIChvYmplY3QpIHsgcmV0dXJuICcweCcgKyBvYmplY3QudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7IH1cbiAgfSxcbiAgZHVtcERlZmF1bHRTdHlsZTogJ2RlY2ltYWwnLFxuICBkdW1wU3R5bGVBbGlhc2VzOiB7XG4gICAgYmluYXJ5OiAgICAgIFsgMiwgICdiaW4nIF0sXG4gICAgb2N0YWw6ICAgICAgIFsgOCwgICdvY3QnIF0sXG4gICAgZGVjaW1hbDogICAgIFsgMTAsICdkZWMnIF0sXG4gICAgaGV4YWRlY2ltYWw6IFsgMTYsICdoZXgnIF1cbiAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIGVzcHJpbWE7XG5cbi8vIEJyb3dzZXJpZmllZCB2ZXJzaW9uIGRvZXMgbm90IGhhdmUgZXNwcmltYVxuLy9cbi8vIDEuIEZvciBub2RlLmpzIGp1c3QgcmVxdWlyZSBtb2R1bGUgYXMgZGVwc1xuLy8gMi4gRm9yIGJyb3dzZXIgdHJ5IHRvIHJlcXVpcmUgbXVkdWxlIHZpYSBleHRlcm5hbCBBTUQgc3lzdGVtLlxuLy8gICAgSWYgbm90IGZvdW5kIC0gdHJ5IHRvIGZhbGxiYWNrIHRvIHdpbmRvdy5lc3ByaW1hLiBJZiBub3Rcbi8vICAgIGZvdW5kIHRvbyAtIHRoZW4gZmFpbCB0byBwYXJzZS5cbi8vXG50cnkge1xuICBlc3ByaW1hID0gcmVxdWlyZSgnZXNwcmltYScpO1xufSBjYXRjaCAoXykge1xuICAvKmdsb2JhbCB3aW5kb3cgKi9cbiAgaWYgKHdpbmRvdykgeyBlc3ByaW1hID0gd2luZG93LmVzcHJpbWE7IH1cbn1cblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uLy4uL3R5cGUnKTtcblxuXG5mdW5jdGlvbiByZXNvbHZlSmF2YXNjcmlwdEZ1bmN0aW9uKHN0YXRlKSB7XG4gIC8qanNsaW50IGV2aWw6dHJ1ZSovXG5cbiAgdHJ5IHtcbiAgICB2YXIgc291cmNlID0gJygnICsgc3RhdGUucmVzdWx0ICsgJyknLFxuICAgICAgICBhc3QgICAgPSBlc3ByaW1hLnBhcnNlKHNvdXJjZSwgeyByYW5nZTogdHJ1ZSB9KSxcbiAgICAgICAgcGFyYW1zID0gW10sXG4gICAgICAgIGJvZHk7XG5cbiAgICBpZiAoJ1Byb2dyYW0nICAgICAgICAgICAgICE9PSBhc3QudHlwZSAgICAgICAgIHx8XG4gICAgICAgIDEgICAgICAgICAgICAgICAgICAgICAhPT0gYXN0LmJvZHkubGVuZ3RoICB8fFxuICAgICAgICAnRXhwcmVzc2lvblN0YXRlbWVudCcgIT09IGFzdC5ib2R5WzBdLnR5cGUgfHxcbiAgICAgICAgJ0Z1bmN0aW9uRXhwcmVzc2lvbicgICE9PSBhc3QuYm9keVswXS5leHByZXNzaW9uLnR5cGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBhc3QuYm9keVswXS5leHByZXNzaW9uLnBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgcGFyYW1zLnB1c2gocGFyYW0ubmFtZSk7XG4gICAgfSk7XG5cbiAgICBib2R5ID0gYXN0LmJvZHlbMF0uZXhwcmVzc2lvbi5ib2R5LnJhbmdlO1xuXG4gICAgLy8gRXNwcmltYSdzIHJhbmdlcyBpbmNsdWRlIHRoZSBmaXJzdCAneycgYW5kIHRoZSBsYXN0ICd9JyBjaGFyYWN0ZXJzIG9uXG4gICAgLy8gZnVuY3Rpb24gZXhwcmVzc2lvbnMuIFNvIGN1dCB0aGVtIG91dC5cbiAgICBzdGF0ZS5yZXN1bHQgPSBuZXcgRnVuY3Rpb24ocGFyYW1zLCBzb3VyY2Uuc2xpY2UoYm9keVswXSsxLCBib2R5WzFdLTEpKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cblxuZnVuY3Rpb24gcmVwcmVzZW50SmF2YXNjcmlwdEZ1bmN0aW9uKG9iamVjdCAvKiwgc3R5bGUqLykge1xuICByZXR1cm4gb2JqZWN0LnRvU3RyaW5nKCk7XG59XG5cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihvYmplY3QpIHtcbiAgcmV0dXJuICdbb2JqZWN0IEZ1bmN0aW9uXScgPT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOmpzL2Z1bmN0aW9uJywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZUphdmFzY3JpcHRGdW5jdGlvbixcbiAgZHVtcFByZWRpY2F0ZTogaXNGdW5jdGlvbixcbiAgZHVtcFJlcHJlc2VudGVyOiByZXByZXNlbnRKYXZhc2NyaXB0RnVuY3Rpb25cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vLi4vdHlwZScpO1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVKYXZhc2NyaXB0UmVnRXhwKHN0YXRlKSB7XG4gIHZhciByZWdleHAgPSBzdGF0ZS5yZXN1bHQsXG4gICAgICB0YWlsICAgPSAvXFwvKFtnaW1dKikkLy5leGVjKHN0YXRlLnJlc3VsdCksXG4gICAgICBtb2RpZmllcnM7XG5cbiAgLy8gYC9mb28vZ2ltYCAtIHRhaWwgY2FuIGJlIG1heGltdW0gNCBjaGFyc1xuICBpZiAoJy8nID09PSByZWdleHBbMF0gJiYgdGFpbCAmJiA0ID49IHRhaWxbMF0ubGVuZ3RoKSB7XG4gICAgcmVnZXhwID0gcmVnZXhwLnNsaWNlKDEsIHJlZ2V4cC5sZW5ndGggLSB0YWlsWzBdLmxlbmd0aCk7XG4gICAgbW9kaWZpZXJzID0gdGFpbFsxXTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgc3RhdGUucmVzdWx0ID0gIG5ldyBSZWdFeHAocmVnZXhwLCBtb2RpZmllcnMpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHJlcHJlc2VudEphdmFzY3JpcHRSZWdFeHAob2JqZWN0IC8qLCBzdHlsZSovKSB7XG4gIHZhciByZXN1bHQgPSAnLycgKyBvYmplY3Quc291cmNlICsgJy8nO1xuXG4gIGlmIChvYmplY3QuZ2xvYmFsKSB7XG4gICAgcmVzdWx0ICs9ICdnJztcbiAgfVxuXG4gIGlmIChvYmplY3QubXVsdGlsaW5lKSB7XG4gICAgcmVzdWx0ICs9ICdtJztcbiAgfVxuXG4gIGlmIChvYmplY3QuaWdub3JlQ2FzZSkge1xuICAgIHJlc3VsdCArPSAnaSc7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIGlzUmVnRXhwKG9iamVjdCkge1xuICByZXR1cm4gJ1tvYmplY3QgUmVnRXhwXScgPT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOmpzL3JlZ2V4cCcsIHtcbiAgbG9hZEtpbmQ6ICdzY2FsYXInLFxuICBsb2FkUmVzb2x2ZXI6IHJlc29sdmVKYXZhc2NyaXB0UmVnRXhwLFxuICBkdW1wUHJlZGljYXRlOiBpc1JlZ0V4cCxcbiAgZHVtcFJlcHJlc2VudGVyOiByZXByZXNlbnRKYXZhc2NyaXB0UmVnRXhwXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uLy4uL3R5cGUnKTtcblxuXG5mdW5jdGlvbiByZXNvbHZlSmF2YXNjcmlwdFVuZGVmaW5lZChzdGF0ZSkge1xuICBzdGF0ZS5yZXN1bHQgPSB1bmRlZmluZWQ7XG4gIHJldHVybiB0cnVlO1xufVxuXG5cbmZ1bmN0aW9uIHJlcHJlc2VudEphdmFzY3JpcHRVbmRlZmluZWQoLypvYmplY3QsIGV4cGxpY2l0Ki8pIHtcbiAgcmV0dXJuICcnO1xufVxuXG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKG9iamVjdCkge1xuICByZXR1cm4gJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiBvYmplY3Q7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6anMvdW5kZWZpbmVkJywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZUphdmFzY3JpcHRVbmRlZmluZWQsXG4gIGR1bXBQcmVkaWNhdGU6IGlzVW5kZWZpbmVkLFxuICBkdW1wUmVwcmVzZW50ZXI6IHJlcHJlc2VudEphdmFzY3JpcHRVbmRlZmluZWRcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOm1hcCcsIHtcbiAgbG9hZEtpbmQ6ICdtYXBwaW5nJ1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxNZXJnZShzdGF0ZSkge1xuICByZXR1cm4gJzw8JyA9PT0gc3RhdGUucmVzdWx0O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOm1lcmdlJywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxNZXJnZVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxudmFyIFlBTUxfTlVMTF9NQVAgPSB7XG4gICd+JyAgICA6IHRydWUsXG4gICdudWxsJyA6IHRydWUsXG4gICdOdWxsJyA6IHRydWUsXG4gICdOVUxMJyA6IHRydWVcbn07XG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxOdWxsKHN0YXRlKSB7XG4gIGlmIChZQU1MX05VTExfTUFQLmhhc093blByb3BlcnR5KHN0YXRlLnJlc3VsdCkpIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSBudWxsO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuXG5mdW5jdGlvbiBpc051bGwob2JqZWN0KSB7XG4gIHJldHVybiBudWxsID09PSBvYmplY3Q7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6bnVsbCcsIHtcbiAgbG9hZEtpbmQ6ICdzY2FsYXInLFxuICBsb2FkUmVzb2x2ZXI6IHJlc29sdmVZYW1sTnVsbCxcbiAgZHVtcFByZWRpY2F0ZTogaXNOdWxsLFxuICBkdW1wUmVwcmVzZW50ZXI6IHtcbiAgICBjYW5vbmljYWw6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICd+JzsgICAgfSxcbiAgICBsb3dlcmNhc2U6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICdudWxsJzsgfSxcbiAgICB1cHBlcmNhc2U6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICdOVUxMJzsgfSxcbiAgICBjYW1lbGNhc2U6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICdOdWxsJzsgfVxuICB9LFxuICBkdW1wRGVmYXVsdFN0eWxlOiAnbG93ZXJjYXNlJ1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxudmFyIF9oYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgX3RvU3RyaW5nICAgICAgID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbE9tYXAoc3RhdGUpIHtcbiAgdmFyIG9iamVjdEtleXMgPSBbXSwgaW5kZXgsIGxlbmd0aCwgcGFpciwgcGFpcktleSwgcGFpckhhc0tleSxcbiAgICAgIG9iamVjdCA9IHN0YXRlLnJlc3VsdDtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBwYWlyID0gb2JqZWN0W2luZGV4XTtcbiAgICBwYWlySGFzS2V5ID0gZmFsc2U7XG5cbiAgICBpZiAoJ1tvYmplY3QgT2JqZWN0XScgIT09IF90b1N0cmluZy5jYWxsKHBhaXIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZm9yIChwYWlyS2V5IGluIHBhaXIpIHtcbiAgICAgIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbChwYWlyLCBwYWlyS2V5KSkge1xuICAgICAgICBpZiAoIXBhaXJIYXNLZXkpIHtcbiAgICAgICAgICBwYWlySGFzS2V5ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXBhaXJIYXNLZXkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoLTEgPT09IG9iamVjdEtleXMuaW5kZXhPZihwYWlyS2V5KSkge1xuICAgICAgb2JqZWN0S2V5cy5wdXNoKHBhaXJLZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6b21hcCcsIHtcbiAgbG9hZEtpbmQ6ICdzZXF1ZW5jZScsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxPbWFwXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG52YXIgX3RvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbFBhaXJzKHN0YXRlKSB7XG4gIHZhciBpbmRleCwgbGVuZ3RoLCBwYWlyLCBrZXlzLCByZXN1bHQsXG4gICAgICBvYmplY3QgPSBzdGF0ZS5yZXN1bHQ7XG5cbiAgcmVzdWx0ID0gbmV3IEFycmF5KG9iamVjdC5sZW5ndGgpO1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHBhaXIgPSBvYmplY3RbaW5kZXhdO1xuXG4gICAgaWYgKCdbb2JqZWN0IE9iamVjdF0nICE9PSBfdG9TdHJpbmcuY2FsbChwYWlyKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGtleXMgPSBPYmplY3Qua2V5cyhwYWlyKTtcblxuICAgIGlmICgxICE9PSBrZXlzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlc3VsdFtpbmRleF0gPSBbIGtleXNbMF0sIHBhaXJba2V5c1swXV0gXTtcbiAgfVxuXG4gIHN0YXRlLnJlc3VsdCA9IHJlc3VsdDtcbiAgcmV0dXJuIHRydWU7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6cGFpcnMnLCB7XG4gIGxvYWRLaW5kOiAnc2VxdWVuY2UnLFxuICBsb2FkUmVzb2x2ZXI6IHJlc29sdmVZYW1sUGFpcnNcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOnNlcScsIHtcbiAgbG9hZEtpbmQ6ICdzZXF1ZW5jZSdcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG5cbnZhciBfaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sU2V0KHN0YXRlKSB7XG4gIHZhciBrZXksIG9iamVjdCA9IHN0YXRlLnJlc3VsdDtcblxuICBmb3IgKGtleSBpbiBvYmplY3QpIHtcbiAgICBpZiAoX2hhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICBpZiAobnVsbCAhPT0gb2JqZWN0W2tleV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOnNldCcsIHtcbiAgbG9hZEtpbmQ6ICdtYXBwaW5nJyxcbiAgbG9hZFJlc29sdmVyOiByZXNvbHZlWWFtbFNldFxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6c3RyJywge1xuICBsb2FkS2luZDogJ3NjYWxhcidcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG5cbnZhciBZQU1MX1RJTUVTVEFNUF9SRUdFWFAgPSBuZXcgUmVnRXhwKFxuICAnXihbMC05XVswLTldWzAtOV1bMC05XSknICAgICAgICAgICsgLy8gWzFdIHllYXJcbiAgJy0oWzAtOV1bMC05XT8pJyAgICAgICAgICAgICAgICAgICArIC8vIFsyXSBtb250aFxuICAnLShbMC05XVswLTldPyknICAgICAgICAgICAgICAgICAgICsgLy8gWzNdIGRheVxuICAnKD86KD86W1R0XXxbIFxcXFx0XSspJyAgICAgICAgICAgICAgKyAvLyAuLi5cbiAgJyhbMC05XVswLTldPyknICAgICAgICAgICAgICAgICAgICArIC8vIFs0XSBob3VyXG4gICc6KFswLTldWzAtOV0pJyAgICAgICAgICAgICAgICAgICAgKyAvLyBbNV0gbWludXRlXG4gICc6KFswLTldWzAtOV0pJyAgICAgICAgICAgICAgICAgICAgKyAvLyBbNl0gc2Vjb25kXG4gICcoPzpcXFxcLihbMC05XSopKT8nICAgICAgICAgICAgICAgICArIC8vIFs3XSBmcmFjdGlvblxuICAnKD86WyBcXFxcdF0qKFp8KFstK10pKFswLTldWzAtOV0/KScgKyAvLyBbOF0gdHogWzldIHR6X3NpZ24gWzEwXSB0el9ob3VyXG4gICcoPzo6KFswLTldWzAtOV0pKT8pKT8pPyQnKTsgICAgICAgICAvLyBbMTFdIHR6X21pbnV0ZVxuXG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sVGltZXN0YW1wKHN0YXRlKSB7XG4gIHZhciBtYXRjaCwgeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQsIGZyYWN0aW9uID0gMCxcbiAgICAgIGRlbHRhID0gbnVsbCwgdHpfaG91ciwgdHpfbWludXRlLCBkYXRhO1xuXG4gIG1hdGNoID0gWUFNTF9USU1FU1RBTVBfUkVHRVhQLmV4ZWMoc3RhdGUucmVzdWx0KTtcblxuICBpZiAobnVsbCA9PT0gbWF0Y2gpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBtYXRjaDogWzFdIHllYXIgWzJdIG1vbnRoIFszXSBkYXlcblxuICB5ZWFyID0gKyhtYXRjaFsxXSk7XG4gIG1vbnRoID0gKyhtYXRjaFsyXSkgLSAxOyAvLyBKUyBtb250aCBzdGFydHMgd2l0aCAwXG4gIGRheSA9ICsobWF0Y2hbM10pO1xuXG4gIGlmICghbWF0Y2hbNF0pIHsgLy8gbm8gaG91clxuICAgIHN0YXRlLnJlc3VsdCA9IG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoLCBkYXkpKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIG1hdGNoOiBbNF0gaG91ciBbNV0gbWludXRlIFs2XSBzZWNvbmQgWzddIGZyYWN0aW9uXG5cbiAgaG91ciA9ICsobWF0Y2hbNF0pO1xuICBtaW51dGUgPSArKG1hdGNoWzVdKTtcbiAgc2Vjb25kID0gKyhtYXRjaFs2XSk7XG5cbiAgaWYgKG1hdGNoWzddKSB7XG4gICAgZnJhY3Rpb24gPSBtYXRjaFs3XS5zbGljZSgwLCAzKTtcbiAgICB3aGlsZSAoZnJhY3Rpb24ubGVuZ3RoIDwgMykgeyAvLyBtaWxsaS1zZWNvbmRzXG4gICAgICBmcmFjdGlvbiArPSAnMCc7XG4gICAgfVxuICAgIGZyYWN0aW9uID0gK2ZyYWN0aW9uO1xuICB9XG5cbiAgLy8gbWF0Y2g6IFs4XSB0eiBbOV0gdHpfc2lnbiBbMTBdIHR6X2hvdXIgWzExXSB0el9taW51dGVcblxuICBpZiAobWF0Y2hbOV0pIHtcbiAgICB0el9ob3VyID0gKyhtYXRjaFsxMF0pO1xuICAgIHR6X21pbnV0ZSA9ICsobWF0Y2hbMTFdIHx8IDApO1xuICAgIGRlbHRhID0gKHR6X2hvdXIgKiA2MCArIHR6X21pbnV0ZSkgKiA2MDAwMDsgLy8gZGVsdGEgaW4gbWlsaS1zZWNvbmRzXG4gICAgaWYgKCctJyA9PT0gbWF0Y2hbOV0pIHtcbiAgICAgIGRlbHRhID0gLWRlbHRhO1xuICAgIH1cbiAgfVxuXG4gIGRhdGEgPSBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZCwgZnJhY3Rpb24pKTtcblxuICBpZiAoZGVsdGEpIHtcbiAgICBkYXRhLnNldFRpbWUoZGF0YS5nZXRUaW1lKCkgLSBkZWx0YSk7XG4gIH1cblxuICBzdGF0ZS5yZXN1bHQgPSBkYXRhO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuXG5mdW5jdGlvbiByZXByZXNlbnRZYW1sVGltZXN0YW1wKG9iamVjdCAvKiwgc3R5bGUqLykge1xuICByZXR1cm4gb2JqZWN0LnRvSVNPU3RyaW5nKCk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6dGltZXN0YW1wJywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxUaW1lc3RhbXAsXG4gIGR1bXBJbnN0YW5jZU9mOiBEYXRlLFxuICBkdW1wUmVwcmVzZW50ZXI6IHJlcHJlc2VudFlhbWxUaW1lc3RhbXBcbn0pO1xuIiwiLypcbiAgQ29weXJpZ2h0IChDKSAyMDEyIEFyaXlhIEhpZGF5YXQgPGFyaXlhLmhpZGF5YXRAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgTWF0aGlhcyBCeW5lbnMgPG1hdGhpYXNAcWl3aS5iZT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIEpvb3N0LVdpbSBCb2VrZXN0ZWlqbiA8am9vc3Qtd2ltQGJvZWtlc3RlaWpuLm5sPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgS3JpcyBLb3dhbCA8a3Jpcy5rb3dhbEBjaXhhci5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMiBZdXN1a2UgU3V6dWtpIDx1dGF0YW5lLnRlYUBnbWFpbC5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMiBBcnBhZCBCb3Jzb3MgPGFycGFkLmJvcnNvc0Bnb29nbGVtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDExIEFyaXlhIEhpZGF5YXQgPGFyaXlhLmhpZGF5YXRAZ21haWwuY29tPlxuXG4gIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcblxuICAgICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuXG4gIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiXG4gIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcbiAgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0VcbiAgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIDxDT1BZUklHSFQgSE9MREVSPiBCRSBMSUFCTEUgRk9SIEFOWVxuICBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFU1xuICAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG4gIExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORFxuICBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0ZcbiAgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiovXG5cbi8qanNsaW50IGJpdHdpc2U6dHJ1ZSBwbHVzcGx1czp0cnVlICovXG4vKmdsb2JhbCBlc3ByaW1hOnRydWUsIGRlZmluZTp0cnVlLCBleHBvcnRzOnRydWUsIHdpbmRvdzogdHJ1ZSxcbnRocm93RXJyb3I6IHRydWUsIGNyZWF0ZUxpdGVyYWw6IHRydWUsIGdlbmVyYXRlU3RhdGVtZW50OiB0cnVlLFxucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbjogdHJ1ZSwgcGFyc2VCbG9jazogdHJ1ZSwgcGFyc2VFeHByZXNzaW9uOiB0cnVlLFxucGFyc2VGdW5jdGlvbkRlY2xhcmF0aW9uOiB0cnVlLCBwYXJzZUZ1bmN0aW9uRXhwcmVzc2lvbjogdHJ1ZSxcbnBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50czogdHJ1ZSwgcGFyc2VWYXJpYWJsZUlkZW50aWZpZXI6IHRydWUsXG5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb246IHRydWUsXG5wYXJzZVN0YXRlbWVudDogdHJ1ZSwgcGFyc2VTb3VyY2VFbGVtZW50OiB0cnVlICovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcyxcbiAgICAvLyBSaGlubywgYW5kIHBsYWluIGJyb3dzZXIgbG9hZGluZy5cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZmFjdG9yeShleHBvcnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KChyb290LmVzcHJpbWEgPSB7fSkpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKGV4cG9ydHMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgVG9rZW4sXG4gICAgICAgIFRva2VuTmFtZSxcbiAgICAgICAgU3ludGF4LFxuICAgICAgICBQcm9wZXJ0eUtpbmQsXG4gICAgICAgIE1lc3NhZ2VzLFxuICAgICAgICBSZWdleCxcbiAgICAgICAgc291cmNlLFxuICAgICAgICBzdHJpY3QsXG4gICAgICAgIGluZGV4LFxuICAgICAgICBsaW5lTnVtYmVyLFxuICAgICAgICBsaW5lU3RhcnQsXG4gICAgICAgIGxlbmd0aCxcbiAgICAgICAgYnVmZmVyLFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgZXh0cmE7XG5cbiAgICBUb2tlbiA9IHtcbiAgICAgICAgQm9vbGVhbkxpdGVyYWw6IDEsXG4gICAgICAgIEVPRjogMixcbiAgICAgICAgSWRlbnRpZmllcjogMyxcbiAgICAgICAgS2V5d29yZDogNCxcbiAgICAgICAgTnVsbExpdGVyYWw6IDUsXG4gICAgICAgIE51bWVyaWNMaXRlcmFsOiA2LFxuICAgICAgICBQdW5jdHVhdG9yOiA3LFxuICAgICAgICBTdHJpbmdMaXRlcmFsOiA4XG4gICAgfTtcblxuICAgIFRva2VuTmFtZSA9IHt9O1xuICAgIFRva2VuTmFtZVtUb2tlbi5Cb29sZWFuTGl0ZXJhbF0gPSAnQm9vbGVhbic7XG4gICAgVG9rZW5OYW1lW1Rva2VuLkVPRl0gPSAnPGVuZD4nO1xuICAgIFRva2VuTmFtZVtUb2tlbi5JZGVudGlmaWVyXSA9ICdJZGVudGlmaWVyJztcbiAgICBUb2tlbk5hbWVbVG9rZW4uS2V5d29yZF0gPSAnS2V5d29yZCc7XG4gICAgVG9rZW5OYW1lW1Rva2VuLk51bGxMaXRlcmFsXSA9ICdOdWxsJztcbiAgICBUb2tlbk5hbWVbVG9rZW4uTnVtZXJpY0xpdGVyYWxdID0gJ051bWVyaWMnO1xuICAgIFRva2VuTmFtZVtUb2tlbi5QdW5jdHVhdG9yXSA9ICdQdW5jdHVhdG9yJztcbiAgICBUb2tlbk5hbWVbVG9rZW4uU3RyaW5nTGl0ZXJhbF0gPSAnU3RyaW5nJztcblxuICAgIFN5bnRheCA9IHtcbiAgICAgICAgQXNzaWdubWVudEV4cHJlc3Npb246ICdBc3NpZ25tZW50RXhwcmVzc2lvbicsXG4gICAgICAgIEFycmF5RXhwcmVzc2lvbjogJ0FycmF5RXhwcmVzc2lvbicsXG4gICAgICAgIEJsb2NrU3RhdGVtZW50OiAnQmxvY2tTdGF0ZW1lbnQnLFxuICAgICAgICBCaW5hcnlFeHByZXNzaW9uOiAnQmluYXJ5RXhwcmVzc2lvbicsXG4gICAgICAgIEJyZWFrU3RhdGVtZW50OiAnQnJlYWtTdGF0ZW1lbnQnLFxuICAgICAgICBDYWxsRXhwcmVzc2lvbjogJ0NhbGxFeHByZXNzaW9uJyxcbiAgICAgICAgQ2F0Y2hDbGF1c2U6ICdDYXRjaENsYXVzZScsXG4gICAgICAgIENvbmRpdGlvbmFsRXhwcmVzc2lvbjogJ0NvbmRpdGlvbmFsRXhwcmVzc2lvbicsXG4gICAgICAgIENvbnRpbnVlU3RhdGVtZW50OiAnQ29udGludWVTdGF0ZW1lbnQnLFxuICAgICAgICBEb1doaWxlU3RhdGVtZW50OiAnRG9XaGlsZVN0YXRlbWVudCcsXG4gICAgICAgIERlYnVnZ2VyU3RhdGVtZW50OiAnRGVidWdnZXJTdGF0ZW1lbnQnLFxuICAgICAgICBFbXB0eVN0YXRlbWVudDogJ0VtcHR5U3RhdGVtZW50JyxcbiAgICAgICAgRXhwcmVzc2lvblN0YXRlbWVudDogJ0V4cHJlc3Npb25TdGF0ZW1lbnQnLFxuICAgICAgICBGb3JTdGF0ZW1lbnQ6ICdGb3JTdGF0ZW1lbnQnLFxuICAgICAgICBGb3JJblN0YXRlbWVudDogJ0ZvckluU3RhdGVtZW50JyxcbiAgICAgICAgRnVuY3Rpb25EZWNsYXJhdGlvbjogJ0Z1bmN0aW9uRGVjbGFyYXRpb24nLFxuICAgICAgICBGdW5jdGlvbkV4cHJlc3Npb246ICdGdW5jdGlvbkV4cHJlc3Npb24nLFxuICAgICAgICBJZGVudGlmaWVyOiAnSWRlbnRpZmllcicsXG4gICAgICAgIElmU3RhdGVtZW50OiAnSWZTdGF0ZW1lbnQnLFxuICAgICAgICBMaXRlcmFsOiAnTGl0ZXJhbCcsXG4gICAgICAgIExhYmVsZWRTdGF0ZW1lbnQ6ICdMYWJlbGVkU3RhdGVtZW50JyxcbiAgICAgICAgTG9naWNhbEV4cHJlc3Npb246ICdMb2dpY2FsRXhwcmVzc2lvbicsXG4gICAgICAgIE1lbWJlckV4cHJlc3Npb246ICdNZW1iZXJFeHByZXNzaW9uJyxcbiAgICAgICAgTmV3RXhwcmVzc2lvbjogJ05ld0V4cHJlc3Npb24nLFxuICAgICAgICBPYmplY3RFeHByZXNzaW9uOiAnT2JqZWN0RXhwcmVzc2lvbicsXG4gICAgICAgIFByb2dyYW06ICdQcm9ncmFtJyxcbiAgICAgICAgUHJvcGVydHk6ICdQcm9wZXJ0eScsXG4gICAgICAgIFJldHVyblN0YXRlbWVudDogJ1JldHVyblN0YXRlbWVudCcsXG4gICAgICAgIFNlcXVlbmNlRXhwcmVzc2lvbjogJ1NlcXVlbmNlRXhwcmVzc2lvbicsXG4gICAgICAgIFN3aXRjaFN0YXRlbWVudDogJ1N3aXRjaFN0YXRlbWVudCcsXG4gICAgICAgIFN3aXRjaENhc2U6ICdTd2l0Y2hDYXNlJyxcbiAgICAgICAgVGhpc0V4cHJlc3Npb246ICdUaGlzRXhwcmVzc2lvbicsXG4gICAgICAgIFRocm93U3RhdGVtZW50OiAnVGhyb3dTdGF0ZW1lbnQnLFxuICAgICAgICBUcnlTdGF0ZW1lbnQ6ICdUcnlTdGF0ZW1lbnQnLFxuICAgICAgICBVbmFyeUV4cHJlc3Npb246ICdVbmFyeUV4cHJlc3Npb24nLFxuICAgICAgICBVcGRhdGVFeHByZXNzaW9uOiAnVXBkYXRlRXhwcmVzc2lvbicsXG4gICAgICAgIFZhcmlhYmxlRGVjbGFyYXRpb246ICdWYXJpYWJsZURlY2xhcmF0aW9uJyxcbiAgICAgICAgVmFyaWFibGVEZWNsYXJhdG9yOiAnVmFyaWFibGVEZWNsYXJhdG9yJyxcbiAgICAgICAgV2hpbGVTdGF0ZW1lbnQ6ICdXaGlsZVN0YXRlbWVudCcsXG4gICAgICAgIFdpdGhTdGF0ZW1lbnQ6ICdXaXRoU3RhdGVtZW50J1xuICAgIH07XG5cbiAgICBQcm9wZXJ0eUtpbmQgPSB7XG4gICAgICAgIERhdGE6IDEsXG4gICAgICAgIEdldDogMixcbiAgICAgICAgU2V0OiA0XG4gICAgfTtcblxuICAgIC8vIEVycm9yIG1lc3NhZ2VzIHNob3VsZCBiZSBpZGVudGljYWwgdG8gVjguXG4gICAgTWVzc2FnZXMgPSB7XG4gICAgICAgIFVuZXhwZWN0ZWRUb2tlbjogICdVbmV4cGVjdGVkIHRva2VuICUwJyxcbiAgICAgICAgVW5leHBlY3RlZE51bWJlcjogICdVbmV4cGVjdGVkIG51bWJlcicsXG4gICAgICAgIFVuZXhwZWN0ZWRTdHJpbmc6ICAnVW5leHBlY3RlZCBzdHJpbmcnLFxuICAgICAgICBVbmV4cGVjdGVkSWRlbnRpZmllcjogICdVbmV4cGVjdGVkIGlkZW50aWZpZXInLFxuICAgICAgICBVbmV4cGVjdGVkUmVzZXJ2ZWQ6ICAnVW5leHBlY3RlZCByZXNlcnZlZCB3b3JkJyxcbiAgICAgICAgVW5leHBlY3RlZEVPUzogICdVbmV4cGVjdGVkIGVuZCBvZiBpbnB1dCcsXG4gICAgICAgIE5ld2xpbmVBZnRlclRocm93OiAgJ0lsbGVnYWwgbmV3bGluZSBhZnRlciB0aHJvdycsXG4gICAgICAgIEludmFsaWRSZWdFeHA6ICdJbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbicsXG4gICAgICAgIFVudGVybWluYXRlZFJlZ0V4cDogICdJbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbjogbWlzc2luZyAvJyxcbiAgICAgICAgSW52YWxpZExIU0luQXNzaWdubWVudDogICdJbnZhbGlkIGxlZnQtaGFuZCBzaWRlIGluIGFzc2lnbm1lbnQnLFxuICAgICAgICBJbnZhbGlkTEhTSW5Gb3JJbjogICdJbnZhbGlkIGxlZnQtaGFuZCBzaWRlIGluIGZvci1pbicsXG4gICAgICAgIE11bHRpcGxlRGVmYXVsdHNJblN3aXRjaDogJ01vcmUgdGhhbiBvbmUgZGVmYXVsdCBjbGF1c2UgaW4gc3dpdGNoIHN0YXRlbWVudCcsXG4gICAgICAgIE5vQ2F0Y2hPckZpbmFsbHk6ICAnTWlzc2luZyBjYXRjaCBvciBmaW5hbGx5IGFmdGVyIHRyeScsXG4gICAgICAgIFVua25vd25MYWJlbDogJ1VuZGVmaW5lZCBsYWJlbCBcXCclMFxcJycsXG4gICAgICAgIFJlZGVjbGFyYXRpb246ICclMCBcXCclMVxcJyBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkJyxcbiAgICAgICAgSWxsZWdhbENvbnRpbnVlOiAnSWxsZWdhbCBjb250aW51ZSBzdGF0ZW1lbnQnLFxuICAgICAgICBJbGxlZ2FsQnJlYWs6ICdJbGxlZ2FsIGJyZWFrIHN0YXRlbWVudCcsXG4gICAgICAgIElsbGVnYWxSZXR1cm46ICdJbGxlZ2FsIHJldHVybiBzdGF0ZW1lbnQnLFxuICAgICAgICBTdHJpY3RNb2RlV2l0aDogICdTdHJpY3QgbW9kZSBjb2RlIG1heSBub3QgaW5jbHVkZSBhIHdpdGggc3RhdGVtZW50JyxcbiAgICAgICAgU3RyaWN0Q2F0Y2hWYXJpYWJsZTogICdDYXRjaCB2YXJpYWJsZSBtYXkgbm90IGJlIGV2YWwgb3IgYXJndW1lbnRzIGluIHN0cmljdCBtb2RlJyxcbiAgICAgICAgU3RyaWN0VmFyTmFtZTogICdWYXJpYWJsZSBuYW1lIG1heSBub3QgYmUgZXZhbCBvciBhcmd1bWVudHMgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RQYXJhbU5hbWU6ICAnUGFyYW1ldGVyIG5hbWUgZXZhbCBvciBhcmd1bWVudHMgaXMgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RQYXJhbUR1cGU6ICdTdHJpY3QgbW9kZSBmdW5jdGlvbiBtYXkgbm90IGhhdmUgZHVwbGljYXRlIHBhcmFtZXRlciBuYW1lcycsXG4gICAgICAgIFN0cmljdEZ1bmN0aW9uTmFtZTogICdGdW5jdGlvbiBuYW1lIG1heSBub3QgYmUgZXZhbCBvciBhcmd1bWVudHMgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RPY3RhbExpdGVyYWw6ICAnT2N0YWwgbGl0ZXJhbHMgYXJlIG5vdCBhbGxvd2VkIGluIHN0cmljdCBtb2RlLicsXG4gICAgICAgIFN0cmljdERlbGV0ZTogICdEZWxldGUgb2YgYW4gdW5xdWFsaWZpZWQgaWRlbnRpZmllciBpbiBzdHJpY3QgbW9kZS4nLFxuICAgICAgICBTdHJpY3REdXBsaWNhdGVQcm9wZXJ0eTogICdEdXBsaWNhdGUgZGF0YSBwcm9wZXJ0eSBpbiBvYmplY3QgbGl0ZXJhbCBub3QgYWxsb3dlZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIEFjY2Vzc29yRGF0YVByb3BlcnR5OiAgJ09iamVjdCBsaXRlcmFsIG1heSBub3QgaGF2ZSBkYXRhIGFuZCBhY2Nlc3NvciBwcm9wZXJ0eSB3aXRoIHRoZSBzYW1lIG5hbWUnLFxuICAgICAgICBBY2Nlc3NvckdldFNldDogICdPYmplY3QgbGl0ZXJhbCBtYXkgbm90IGhhdmUgbXVsdGlwbGUgZ2V0L3NldCBhY2Nlc3NvcnMgd2l0aCB0aGUgc2FtZSBuYW1lJyxcbiAgICAgICAgU3RyaWN0TEhTQXNzaWdubWVudDogICdBc3NpZ25tZW50IHRvIGV2YWwgb3IgYXJndW1lbnRzIGlzIG5vdCBhbGxvd2VkIGluIHN0cmljdCBtb2RlJyxcbiAgICAgICAgU3RyaWN0TEhTUG9zdGZpeDogICdQb3N0Zml4IGluY3JlbWVudC9kZWNyZW1lbnQgbWF5IG5vdCBoYXZlIGV2YWwgb3IgYXJndW1lbnRzIG9wZXJhbmQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RMSFNQcmVmaXg6ICAnUHJlZml4IGluY3JlbWVudC9kZWNyZW1lbnQgbWF5IG5vdCBoYXZlIGV2YWwgb3IgYXJndW1lbnRzIG9wZXJhbmQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RSZXNlcnZlZFdvcmQ6ICAnVXNlIG9mIGZ1dHVyZSByZXNlcnZlZCB3b3JkIGluIHN0cmljdCBtb2RlJ1xuICAgIH07XG5cbiAgICAvLyBTZWUgYWxzbyB0b29scy9nZW5lcmF0ZS11bmljb2RlLXJlZ2V4LnB5LlxuICAgIFJlZ2V4ID0ge1xuICAgICAgICBOb25Bc2NpaUlkZW50aWZpZXJTdGFydDogbmV3IFJlZ0V4cCgnW1xceGFhXFx4YjVcXHhiYVxceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHUwMmMxXFx1MDJjNi1cXHUwMmQxXFx1MDJlMC1cXHUwMmU0XFx1MDJlY1xcdTAyZWVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN2EtXFx1MDM3ZFxcdTAzODZcXHUwMzg4LVxcdTAzOGFcXHUwMzhjXFx1MDM4ZS1cXHUwM2ExXFx1MDNhMy1cXHUwM2Y1XFx1MDNmNy1cXHUwNDgxXFx1MDQ4YS1cXHUwNTI3XFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1ZDAtXFx1MDVlYVxcdTA1ZjAtXFx1MDVmMlxcdTA2MjAtXFx1MDY0YVxcdTA2NmVcXHUwNjZmXFx1MDY3MS1cXHUwNmQzXFx1MDZkNVxcdTA2ZTVcXHUwNmU2XFx1MDZlZVxcdTA2ZWZcXHUwNmZhLVxcdTA2ZmNcXHUwNmZmXFx1MDcxMFxcdTA3MTItXFx1MDcyZlxcdTA3NGQtXFx1MDdhNVxcdTA3YjFcXHUwN2NhLVxcdTA3ZWFcXHUwN2Y0XFx1MDdmNVxcdTA3ZmFcXHUwODAwLVxcdTA4MTVcXHUwODFhXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwOGEwXFx1MDhhMi1cXHUwOGFjXFx1MDkwNC1cXHUwOTM5XFx1MDkzZFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N2ZcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJkXFx1MDljZVxcdTA5ZGNcXHUwOWRkXFx1MDlkZi1cXHUwOWUxXFx1MDlmMFxcdTA5ZjFcXHUwYTA1LVxcdTBhMGFcXHUwYTBmXFx1MGExMFxcdTBhMTMtXFx1MGEyOFxcdTBhMmEtXFx1MGEzMFxcdTBhMzJcXHUwYTMzXFx1MGEzNVxcdTBhMzZcXHUwYTM4XFx1MGEzOVxcdTBhNTktXFx1MGE1Y1xcdTBhNWVcXHUwYTcyLVxcdTBhNzRcXHUwYTg1LVxcdTBhOGRcXHUwYThmLVxcdTBhOTFcXHUwYTkzLVxcdTBhYThcXHUwYWFhLVxcdTBhYjBcXHUwYWIyXFx1MGFiM1xcdTBhYjUtXFx1MGFiOVxcdTBhYmRcXHUwYWQwXFx1MGFlMFxcdTBhZTFcXHUwYjA1LVxcdTBiMGNcXHUwYjBmXFx1MGIxMFxcdTBiMTMtXFx1MGIyOFxcdTBiMmEtXFx1MGIzMFxcdTBiMzJcXHUwYjMzXFx1MGIzNS1cXHUwYjM5XFx1MGIzZFxcdTBiNWNcXHUwYjVkXFx1MGI1Zi1cXHUwYjYxXFx1MGI3MVxcdTBiODNcXHUwYjg1LVxcdTBiOGFcXHUwYjhlLVxcdTBiOTBcXHUwYjkyLVxcdTBiOTVcXHUwYjk5XFx1MGI5YVxcdTBiOWNcXHUwYjllXFx1MGI5ZlxcdTBiYTNcXHUwYmE0XFx1MGJhOC1cXHUwYmFhXFx1MGJhZS1cXHUwYmI5XFx1MGJkMFxcdTBjMDUtXFx1MGMwY1xcdTBjMGUtXFx1MGMxMFxcdTBjMTItXFx1MGMyOFxcdTBjMmEtXFx1MGMzM1xcdTBjMzUtXFx1MGMzOVxcdTBjM2RcXHUwYzU4XFx1MGM1OVxcdTBjNjBcXHUwYzYxXFx1MGM4NS1cXHUwYzhjXFx1MGM4ZS1cXHUwYzkwXFx1MGM5Mi1cXHUwY2E4XFx1MGNhYS1cXHUwY2IzXFx1MGNiNS1cXHUwY2I5XFx1MGNiZFxcdTBjZGVcXHUwY2UwXFx1MGNlMVxcdTBjZjFcXHUwY2YyXFx1MGQwNS1cXHUwZDBjXFx1MGQwZS1cXHUwZDEwXFx1MGQxMi1cXHUwZDNhXFx1MGQzZFxcdTBkNGVcXHUwZDYwXFx1MGQ2MVxcdTBkN2EtXFx1MGQ3ZlxcdTBkODUtXFx1MGQ5NlxcdTBkOWEtXFx1MGRiMVxcdTBkYjMtXFx1MGRiYlxcdTBkYmRcXHUwZGMwLVxcdTBkYzZcXHUwZTAxLVxcdTBlMzBcXHUwZTMyXFx1MGUzM1xcdTBlNDAtXFx1MGU0NlxcdTBlODFcXHUwZTgyXFx1MGU4NFxcdTBlODdcXHUwZTg4XFx1MGU4YVxcdTBlOGRcXHUwZTk0LVxcdTBlOTdcXHUwZTk5LVxcdTBlOWZcXHUwZWExLVxcdTBlYTNcXHUwZWE1XFx1MGVhN1xcdTBlYWFcXHUwZWFiXFx1MGVhZC1cXHUwZWIwXFx1MGViMlxcdTBlYjNcXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjQwLVxcdTBmNDdcXHUwZjQ5LVxcdTBmNmNcXHUwZjg4LVxcdTBmOGNcXHUxMDAwLVxcdTEwMmFcXHUxMDNmXFx1MTA1MC1cXHUxMDU1XFx1MTA1YS1cXHUxMDVkXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2ZS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4ZVxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjBcXHUxNzAwLVxcdTE3MGNcXHUxNzBlLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzgwLVxcdTE3YjNcXHUxN2Q3XFx1MTdkY1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThhOFxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWNcXHUxOTUwLVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWMxLVxcdTE5YzdcXHUxYTAwLVxcdTFhMTZcXHUxYTIwLVxcdTFhNTRcXHUxYWE3XFx1MWIwNS1cXHUxYjMzXFx1MWI0NS1cXHUxYjRiXFx1MWI4My1cXHUxYmEwXFx1MWJhZVxcdTFiYWZcXHUxYmJhLVxcdTFiZTVcXHUxYzAwLVxcdTFjMjNcXHUxYzRkLVxcdTFjNGZcXHUxYzVhLVxcdTFjN2RcXHUxY2U5LVxcdTFjZWNcXHUxY2VlLVxcdTFjZjFcXHUxY2Y1XFx1MWNmNlxcdTFkMDAtXFx1MWRiZlxcdTFlMDAtXFx1MWYxNVxcdTFmMTgtXFx1MWYxZFxcdTFmMjAtXFx1MWY0NVxcdTFmNDgtXFx1MWY0ZFxcdTFmNTAtXFx1MWY1N1xcdTFmNTlcXHUxZjViXFx1MWY1ZFxcdTFmNWYtXFx1MWY3ZFxcdTFmODAtXFx1MWZiNFxcdTFmYjYtXFx1MWZiY1xcdTFmYmVcXHUxZmMyLVxcdTFmYzRcXHUxZmM2LVxcdTFmY2NcXHUxZmQwLVxcdTFmZDNcXHUxZmQ2LVxcdTFmZGJcXHUxZmUwLVxcdTFmZWNcXHUxZmYyLVxcdTFmZjRcXHUxZmY2LVxcdTFmZmNcXHUyMDcxXFx1MjA3ZlxcdTIwOTAtXFx1MjA5Y1xcdTIxMDJcXHUyMTA3XFx1MjEwYS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExZFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMmEtXFx1MjEyZFxcdTIxMmYtXFx1MjEzOVxcdTIxM2MtXFx1MjEzZlxcdTIxNDUtXFx1MjE0OVxcdTIxNGVcXHUyMTYwLVxcdTIxODhcXHUyYzAwLVxcdTJjMmVcXHUyYzMwLVxcdTJjNWVcXHUyYzYwLVxcdTJjZTRcXHUyY2ViLVxcdTJjZWVcXHUyY2YyXFx1MmNmM1xcdTJkMDAtXFx1MmQyNVxcdTJkMjdcXHUyZDJkXFx1MmQzMC1cXHUyZDY3XFx1MmQ2ZlxcdTJkODAtXFx1MmQ5NlxcdTJkYTAtXFx1MmRhNlxcdTJkYTgtXFx1MmRhZVxcdTJkYjAtXFx1MmRiNlxcdTJkYjgtXFx1MmRiZVxcdTJkYzAtXFx1MmRjNlxcdTJkYzgtXFx1MmRjZVxcdTJkZDAtXFx1MmRkNlxcdTJkZDgtXFx1MmRkZVxcdTJlMmZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDlkLVxcdTMwOWZcXHUzMGExLVxcdTMwZmFcXHUzMGZjLVxcdTMwZmZcXHUzMTA1LVxcdTMxMmRcXHUzMTMxLVxcdTMxOGVcXHUzMWEwLVxcdTMxYmFcXHUzMWYwLVxcdTMxZmZcXHUzNDAwLVxcdTRkYjVcXHU0ZTAwLVxcdTlmY2NcXHVhMDAwLVxcdWE0OGNcXHVhNGQwLVxcdWE0ZmRcXHVhNTAwLVxcdWE2MGNcXHVhNjEwLVxcdWE2MWZcXHVhNjJhXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZVxcdWE2N2YtXFx1YTY5N1xcdWE2YTAtXFx1YTZlZlxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTc4ZVxcdWE3OTAtXFx1YTc5M1xcdWE3YTAtXFx1YTdhYVxcdWE3ZjgtXFx1YTgwMVxcdWE4MDMtXFx1YTgwNVxcdWE4MDctXFx1YTgwYVxcdWE4MGMtXFx1YTgyMlxcdWE4NDAtXFx1YTg3M1xcdWE4ODItXFx1YThiM1xcdWE4ZjItXFx1YThmN1xcdWE4ZmJcXHVhOTBhLVxcdWE5MjVcXHVhOTMwLVxcdWE5NDZcXHVhOTYwLVxcdWE5N2NcXHVhOTg0LVxcdWE5YjJcXHVhOWNmXFx1YWEwMC1cXHVhYTI4XFx1YWE0MC1cXHVhYTQyXFx1YWE0NC1cXHVhYTRiXFx1YWE2MC1cXHVhYTc2XFx1YWE3YVxcdWFhODAtXFx1YWFhZlxcdWFhYjFcXHVhYWI1XFx1YWFiNlxcdWFhYjktXFx1YWFiZFxcdWFhYzBcXHVhYWMyXFx1YWFkYi1cXHVhYWRkXFx1YWFlMC1cXHVhYWVhXFx1YWFmMi1cXHVhYWY0XFx1YWIwMS1cXHVhYjA2XFx1YWIwOS1cXHVhYjBlXFx1YWIxMS1cXHVhYjE2XFx1YWIyMC1cXHVhYjI2XFx1YWIyOC1cXHVhYjJlXFx1YWJjMC1cXHVhYmUyXFx1YWMwMC1cXHVkN2EzXFx1ZDdiMC1cXHVkN2M2XFx1ZDdjYi1cXHVkN2ZiXFx1ZjkwMC1cXHVmYTZkXFx1ZmE3MC1cXHVmYWQ5XFx1ZmIwMC1cXHVmYjA2XFx1ZmIxMy1cXHVmYjE3XFx1ZmIxZFxcdWZiMWYtXFx1ZmIyOFxcdWZiMmEtXFx1ZmIzNlxcdWZiMzgtXFx1ZmIzY1xcdWZiM2VcXHVmYjQwXFx1ZmI0MVxcdWZiNDNcXHVmYjQ0XFx1ZmI0Ni1cXHVmYmIxXFx1ZmJkMy1cXHVmZDNkXFx1ZmQ1MC1cXHVmZDhmXFx1ZmQ5Mi1cXHVmZGM3XFx1ZmRmMC1cXHVmZGZiXFx1ZmU3MC1cXHVmZTc0XFx1ZmU3Ni1cXHVmZWZjXFx1ZmYyMS1cXHVmZjNhXFx1ZmY0MS1cXHVmZjVhXFx1ZmY2Ni1cXHVmZmJlXFx1ZmZjMi1cXHVmZmM3XFx1ZmZjYS1cXHVmZmNmXFx1ZmZkMi1cXHVmZmQ3XFx1ZmZkYS1cXHVmZmRjXScpLFxuICAgICAgICBOb25Bc2NpaUlkZW50aWZpZXJQYXJ0OiBuZXcgUmVnRXhwKCdbXFx4YWFcXHhiNVxceGJhXFx4YzAtXFx4ZDZcXHhkOC1cXHhmNlxceGY4LVxcdTAyYzFcXHUwMmM2LVxcdTAyZDFcXHUwMmUwLVxcdTAyZTRcXHUwMmVjXFx1MDJlZVxcdTAzMDAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3YS1cXHUwMzdkXFx1MDM4NlxcdTAzODgtXFx1MDM4YVxcdTAzOGNcXHUwMzhlLVxcdTAzYTFcXHUwM2EzLVxcdTAzZjVcXHUwM2Y3LVxcdTA0ODFcXHUwNDgzLVxcdTA0ODdcXHUwNDhhLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDU5MS1cXHUwNWJkXFx1MDViZlxcdTA1YzFcXHUwNWMyXFx1MDVjNFxcdTA1YzVcXHUwNWM3XFx1MDVkMC1cXHUwNWVhXFx1MDVmMC1cXHUwNWYyXFx1MDYxMC1cXHUwNjFhXFx1MDYyMC1cXHUwNjY5XFx1MDY2ZS1cXHUwNmQzXFx1MDZkNS1cXHUwNmRjXFx1MDZkZi1cXHUwNmU4XFx1MDZlYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTAtXFx1MDc0YVxcdTA3NGQtXFx1MDdiMVxcdTA3YzAtXFx1MDdmNVxcdTA3ZmFcXHUwODAwLVxcdTA4MmRcXHUwODQwLVxcdTA4NWJcXHUwOGEwXFx1MDhhMi1cXHUwOGFjXFx1MDhlNC1cXHUwOGZlXFx1MDkwMC1cXHUwOTYzXFx1MDk2Ni1cXHUwOTZmXFx1MDk3MS1cXHUwOTc3XFx1MDk3OS1cXHUwOTdmXFx1MDk4MS1cXHUwOTgzXFx1MDk4NS1cXHUwOThjXFx1MDk4ZlxcdTA5OTBcXHUwOTkzLVxcdTA5YThcXHUwOWFhLVxcdTA5YjBcXHUwOWIyXFx1MDliNi1cXHUwOWI5XFx1MDliYy1cXHUwOWM0XFx1MDljN1xcdTA5YzhcXHUwOWNiLVxcdTA5Y2VcXHUwOWQ3XFx1MDlkY1xcdTA5ZGRcXHUwOWRmLVxcdTA5ZTNcXHUwOWU2LVxcdTA5ZjFcXHUwYTAxLVxcdTBhMDNcXHUwYTA1LVxcdTBhMGFcXHUwYTBmXFx1MGExMFxcdTBhMTMtXFx1MGEyOFxcdTBhMmEtXFx1MGEzMFxcdTBhMzJcXHUwYTMzXFx1MGEzNVxcdTBhMzZcXHUwYTM4XFx1MGEzOVxcdTBhM2NcXHUwYTNlLVxcdTBhNDJcXHUwYTQ3XFx1MGE0OFxcdTBhNGItXFx1MGE0ZFxcdTBhNTFcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE2Ni1cXHUwYTc1XFx1MGE4MS1cXHUwYTgzXFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJjLVxcdTBhYzVcXHUwYWM3LVxcdTBhYzlcXHUwYWNiLVxcdTBhY2RcXHUwYWQwXFx1MGFlMC1cXHUwYWUzXFx1MGFlNi1cXHUwYWVmXFx1MGIwMS1cXHUwYjAzXFx1MGIwNS1cXHUwYjBjXFx1MGIwZlxcdTBiMTBcXHUwYjEzLVxcdTBiMjhcXHUwYjJhLVxcdTBiMzBcXHUwYjMyXFx1MGIzM1xcdTBiMzUtXFx1MGIzOVxcdTBiM2MtXFx1MGI0NFxcdTBiNDdcXHUwYjQ4XFx1MGI0Yi1cXHUwYjRkXFx1MGI1NlxcdTBiNTdcXHUwYjVjXFx1MGI1ZFxcdTBiNWYtXFx1MGI2M1xcdTBiNjYtXFx1MGI2ZlxcdTBiNzFcXHUwYjgyXFx1MGI4M1xcdTBiODUtXFx1MGI4YVxcdTBiOGUtXFx1MGI5MFxcdTBiOTItXFx1MGI5NVxcdTBiOTlcXHUwYjlhXFx1MGI5Y1xcdTBiOWVcXHUwYjlmXFx1MGJhM1xcdTBiYTRcXHUwYmE4LVxcdTBiYWFcXHUwYmFlLVxcdTBiYjlcXHUwYmJlLVxcdTBiYzJcXHUwYmM2LVxcdTBiYzhcXHUwYmNhLVxcdTBiY2RcXHUwYmQwXFx1MGJkN1xcdTBiZTYtXFx1MGJlZlxcdTBjMDEtXFx1MGMwM1xcdTBjMDUtXFx1MGMwY1xcdTBjMGUtXFx1MGMxMFxcdTBjMTItXFx1MGMyOFxcdTBjMmEtXFx1MGMzM1xcdTBjMzUtXFx1MGMzOVxcdTBjM2QtXFx1MGM0NFxcdTBjNDYtXFx1MGM0OFxcdTBjNGEtXFx1MGM0ZFxcdTBjNTVcXHUwYzU2XFx1MGM1OFxcdTBjNTlcXHUwYzYwLVxcdTBjNjNcXHUwYzY2LVxcdTBjNmZcXHUwYzgyXFx1MGM4M1xcdTBjODUtXFx1MGM4Y1xcdTBjOGUtXFx1MGM5MFxcdTBjOTItXFx1MGNhOFxcdTBjYWEtXFx1MGNiM1xcdTBjYjUtXFx1MGNiOVxcdTBjYmMtXFx1MGNjNFxcdTBjYzYtXFx1MGNjOFxcdTBjY2EtXFx1MGNjZFxcdTBjZDVcXHUwY2Q2XFx1MGNkZVxcdTBjZTAtXFx1MGNlM1xcdTBjZTYtXFx1MGNlZlxcdTBjZjFcXHUwY2YyXFx1MGQwMlxcdTBkMDNcXHUwZDA1LVxcdTBkMGNcXHUwZDBlLVxcdTBkMTBcXHUwZDEyLVxcdTBkM2FcXHUwZDNkLVxcdTBkNDRcXHUwZDQ2LVxcdTBkNDhcXHUwZDRhLVxcdTBkNGVcXHUwZDU3XFx1MGQ2MC1cXHUwZDYzXFx1MGQ2Ni1cXHUwZDZmXFx1MGQ3YS1cXHUwZDdmXFx1MGQ4MlxcdTBkODNcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGRjYVxcdTBkY2YtXFx1MGRkNFxcdTBkZDZcXHUwZGQ4LVxcdTBkZGZcXHUwZGYyXFx1MGRmM1xcdTBlMDEtXFx1MGUzYVxcdTBlNDAtXFx1MGU0ZVxcdTBlNTAtXFx1MGU1OVxcdTBlODFcXHUwZTgyXFx1MGU4NFxcdTBlODdcXHUwZTg4XFx1MGU4YVxcdTBlOGRcXHUwZTk0LVxcdTBlOTdcXHUwZTk5LVxcdTBlOWZcXHUwZWExLVxcdTBlYTNcXHUwZWE1XFx1MGVhN1xcdTBlYWFcXHUwZWFiXFx1MGVhZC1cXHUwZWI5XFx1MGViYi1cXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlYzgtXFx1MGVjZFxcdTBlZDAtXFx1MGVkOVxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjE4XFx1MGYxOVxcdTBmMjAtXFx1MGYyOVxcdTBmMzVcXHUwZjM3XFx1MGYzOVxcdTBmM2UtXFx1MGY0N1xcdTBmNDktXFx1MGY2Y1xcdTBmNzEtXFx1MGY4NFxcdTBmODYtXFx1MGY5N1xcdTBmOTktXFx1MGZiY1xcdTBmYzZcXHUxMDAwLVxcdTEwNDlcXHUxMDUwLVxcdTEwOWRcXHUxMGEwLVxcdTEwYzVcXHUxMGM3XFx1MTBjZFxcdTEwZDAtXFx1MTBmYVxcdTEwZmMtXFx1MTI0OFxcdTEyNGEtXFx1MTI0ZFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVhLVxcdTEyNWRcXHUxMjYwLVxcdTEyODhcXHUxMjhhLVxcdTEyOGRcXHUxMjkwLVxcdTEyYjBcXHUxMmIyLVxcdTEyYjVcXHUxMmI4LVxcdTEyYmVcXHUxMmMwXFx1MTJjMi1cXHUxMmM1XFx1MTJjOC1cXHUxMmQ2XFx1MTJkOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVhXFx1MTM1ZC1cXHUxMzVmXFx1MTM4MC1cXHUxMzhmXFx1MTNhMC1cXHUxM2Y0XFx1MTQwMS1cXHUxNjZjXFx1MTY2Zi1cXHUxNjdmXFx1MTY4MS1cXHUxNjlhXFx1MTZhMC1cXHUxNmVhXFx1MTZlZS1cXHUxNmYwXFx1MTcwMC1cXHUxNzBjXFx1MTcwZS1cXHUxNzE0XFx1MTcyMC1cXHUxNzM0XFx1MTc0MC1cXHUxNzUzXFx1MTc2MC1cXHUxNzZjXFx1MTc2ZS1cXHUxNzcwXFx1MTc3MlxcdTE3NzNcXHUxNzgwLVxcdTE3ZDNcXHUxN2Q3XFx1MTdkY1xcdTE3ZGRcXHUxN2UwLVxcdTE3ZTlcXHUxODBiLVxcdTE4MGRcXHUxODEwLVxcdTE4MTlcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWNcXHUxOTIwLVxcdTE5MmJcXHUxOTMwLVxcdTE5M2JcXHUxOTQ2LVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWIwLVxcdTE5YzlcXHUxOWQwLVxcdTE5ZDlcXHUxYTAwLVxcdTFhMWJcXHUxYTIwLVxcdTFhNWVcXHUxYTYwLVxcdTFhN2NcXHUxYTdmLVxcdTFhODlcXHUxYTkwLVxcdTFhOTlcXHUxYWE3XFx1MWIwMC1cXHUxYjRiXFx1MWI1MC1cXHUxYjU5XFx1MWI2Yi1cXHUxYjczXFx1MWI4MC1cXHUxYmYzXFx1MWMwMC1cXHUxYzM3XFx1MWM0MC1cXHUxYzQ5XFx1MWM0ZC1cXHUxYzdkXFx1MWNkMC1cXHUxY2QyXFx1MWNkNC1cXHUxY2Y2XFx1MWQwMC1cXHUxZGU2XFx1MWRmYy1cXHUxZjE1XFx1MWYxOC1cXHUxZjFkXFx1MWYyMC1cXHUxZjQ1XFx1MWY0OC1cXHUxZjRkXFx1MWY1MC1cXHUxZjU3XFx1MWY1OVxcdTFmNWJcXHUxZjVkXFx1MWY1Zi1cXHUxZjdkXFx1MWY4MC1cXHUxZmI0XFx1MWZiNi1cXHUxZmJjXFx1MWZiZVxcdTFmYzItXFx1MWZjNFxcdTFmYzYtXFx1MWZjY1xcdTFmZDAtXFx1MWZkM1xcdTFmZDYtXFx1MWZkYlxcdTFmZTAtXFx1MWZlY1xcdTFmZjItXFx1MWZmNFxcdTFmZjYtXFx1MWZmY1xcdTIwMGNcXHUyMDBkXFx1MjAzZlxcdTIwNDBcXHUyMDU0XFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMGQwLVxcdTIwZGNcXHUyMGUxXFx1MjBlNS1cXHUyMGYwXFx1MjEwMlxcdTIxMDdcXHUyMTBhLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFkXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyYS1cXHUyMTJkXFx1MjEyZi1cXHUyMTM5XFx1MjEzYy1cXHUyMTNmXFx1MjE0NS1cXHUyMTQ5XFx1MjE0ZVxcdTIxNjAtXFx1MjE4OFxcdTJjMDAtXFx1MmMyZVxcdTJjMzAtXFx1MmM1ZVxcdTJjNjAtXFx1MmNlNFxcdTJjZWItXFx1MmNmM1xcdTJkMDAtXFx1MmQyNVxcdTJkMjdcXHUyZDJkXFx1MmQzMC1cXHUyZDY3XFx1MmQ2ZlxcdTJkN2YtXFx1MmQ5NlxcdTJkYTAtXFx1MmRhNlxcdTJkYTgtXFx1MmRhZVxcdTJkYjAtXFx1MmRiNlxcdTJkYjgtXFx1MmRiZVxcdTJkYzAtXFx1MmRjNlxcdTJkYzgtXFx1MmRjZVxcdTJkZDAtXFx1MmRkNlxcdTJkZDgtXFx1MmRkZVxcdTJkZTAtXFx1MmRmZlxcdTJlMmZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMmZcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDk5XFx1MzA5YVxcdTMwOWQtXFx1MzA5ZlxcdTMwYTEtXFx1MzBmYVxcdTMwZmMtXFx1MzBmZlxcdTMxMDUtXFx1MzEyZFxcdTMxMzEtXFx1MzE4ZVxcdTMxYTAtXFx1MzFiYVxcdTMxZjAtXFx1MzFmZlxcdTM0MDAtXFx1NGRiNVxcdTRlMDAtXFx1OWZjY1xcdWEwMDAtXFx1YTQ4Y1xcdWE0ZDAtXFx1YTRmZFxcdWE1MDAtXFx1YTYwY1xcdWE2MTAtXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZlxcdWE2NzQtXFx1YTY3ZFxcdWE2N2YtXFx1YTY5N1xcdWE2OWYtXFx1YTZmMVxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTc4ZVxcdWE3OTAtXFx1YTc5M1xcdWE3YTAtXFx1YTdhYVxcdWE3ZjgtXFx1YTgyN1xcdWE4NDAtXFx1YTg3M1xcdWE4ODAtXFx1YThjNFxcdWE4ZDAtXFx1YThkOVxcdWE4ZTAtXFx1YThmN1xcdWE4ZmJcXHVhOTAwLVxcdWE5MmRcXHVhOTMwLVxcdWE5NTNcXHVhOTYwLVxcdWE5N2NcXHVhOTgwLVxcdWE5YzBcXHVhOWNmLVxcdWE5ZDlcXHVhYTAwLVxcdWFhMzZcXHVhYTQwLVxcdWFhNGRcXHVhYTUwLVxcdWFhNTlcXHVhYTYwLVxcdWFhNzZcXHVhYTdhXFx1YWE3YlxcdWFhODAtXFx1YWFjMlxcdWFhZGItXFx1YWFkZFxcdWFhZTAtXFx1YWFlZlxcdWFhZjItXFx1YWFmNlxcdWFiMDEtXFx1YWIwNlxcdWFiMDktXFx1YWIwZVxcdWFiMTEtXFx1YWIxNlxcdWFiMjAtXFx1YWIyNlxcdWFiMjgtXFx1YWIyZVxcdWFiYzAtXFx1YWJlYVxcdWFiZWNcXHVhYmVkXFx1YWJmMC1cXHVhYmY5XFx1YWMwMC1cXHVkN2EzXFx1ZDdiMC1cXHVkN2M2XFx1ZDdjYi1cXHVkN2ZiXFx1ZjkwMC1cXHVmYTZkXFx1ZmE3MC1cXHVmYWQ5XFx1ZmIwMC1cXHVmYjA2XFx1ZmIxMy1cXHVmYjE3XFx1ZmIxZC1cXHVmYjI4XFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDBcXHVmYjQxXFx1ZmI0M1xcdWZiNDRcXHVmYjQ2LVxcdWZiYjFcXHVmYmQzLVxcdWZkM2RcXHVmZDUwLVxcdWZkOGZcXHVmZDkyLVxcdWZkYzdcXHVmZGYwLVxcdWZkZmJcXHVmZTAwLVxcdWZlMGZcXHVmZTIwLVxcdWZlMjZcXHVmZTMzXFx1ZmUzNFxcdWZlNGQtXFx1ZmU0ZlxcdWZlNzAtXFx1ZmU3NFxcdWZlNzYtXFx1ZmVmY1xcdWZmMTAtXFx1ZmYxOVxcdWZmMjEtXFx1ZmYzYVxcdWZmM2ZcXHVmZjQxLVxcdWZmNWFcXHVmZjY2LVxcdWZmYmVcXHVmZmMyLVxcdWZmYzdcXHVmZmNhLVxcdWZmY2ZcXHVmZmQyLVxcdWZmZDdcXHVmZmRhLVxcdWZmZGNdJylcbiAgICB9O1xuXG4gICAgLy8gRW5zdXJlIHRoZSBjb25kaXRpb24gaXMgdHJ1ZSwgb3RoZXJ3aXNlIHRocm93IGFuIGVycm9yLlxuICAgIC8vIFRoaXMgaXMgb25seSB0byBoYXZlIGEgYmV0dGVyIGNvbnRyYWN0IHNlbWFudGljLCBpLmUuIGFub3RoZXIgc2FmZXR5IG5ldFxuICAgIC8vIHRvIGNhdGNoIGEgbG9naWMgZXJyb3IuIFRoZSBjb25kaXRpb24gc2hhbGwgYmUgZnVsZmlsbGVkIGluIG5vcm1hbCBjYXNlLlxuICAgIC8vIERvIE5PVCB1c2UgdGhpcyB0byBlbmZvcmNlIGEgY2VydGFpbiBjb25kaXRpb24gb24gYW55IHVzZXIgaW5wdXQuXG5cbiAgICBmdW5jdGlvbiBhc3NlcnQoY29uZGl0aW9uLCBtZXNzYWdlKSB7XG4gICAgICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FTU0VSVDogJyArIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2xpY2VTb3VyY2UoZnJvbSwgdG8pIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZS5zbGljZShmcm9tLCB0byk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiAnZXNwcmltYSdbMF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNsaWNlU291cmNlID0gZnVuY3Rpb24gc2xpY2VBcnJheVNvdXJjZShmcm9tLCB0bykge1xuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS5zbGljZShmcm9tLCB0bykuam9pbignJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEZWNpbWFsRGlnaXQoY2gpIHtcbiAgICAgICAgcmV0dXJuICcwMTIzNDU2Nzg5Jy5pbmRleE9mKGNoKSA+PSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzSGV4RGlnaXQoY2gpIHtcbiAgICAgICAgcmV0dXJuICcwMTIzNDU2Nzg5YWJjZGVmQUJDREVGJy5pbmRleE9mKGNoKSA+PSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzT2N0YWxEaWdpdChjaCkge1xuICAgICAgICByZXR1cm4gJzAxMjM0NTY3Jy5pbmRleE9mKGNoKSA+PSAwO1xuICAgIH1cblxuXG4gICAgLy8gNy4yIFdoaXRlIFNwYWNlXG5cbiAgICBmdW5jdGlvbiBpc1doaXRlU3BhY2UoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA9PT0gJyAnKSB8fCAoY2ggPT09ICdcXHUwMDA5JykgfHwgKGNoID09PSAnXFx1MDAwQicpIHx8XG4gICAgICAgICAgICAoY2ggPT09ICdcXHUwMDBDJykgfHwgKGNoID09PSAnXFx1MDBBMCcpIHx8XG4gICAgICAgICAgICAoY2guY2hhckNvZGVBdCgwKSA+PSAweDE2ODAgJiZcbiAgICAgICAgICAgICAnXFx1MTY4MFxcdTE4MEVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwQVxcdTIwMkZcXHUyMDVGXFx1MzAwMFxcdUZFRkYnLmluZGV4T2YoY2gpID49IDApO1xuICAgIH1cblxuICAgIC8vIDcuMyBMaW5lIFRlcm1pbmF0b3JzXG5cbiAgICBmdW5jdGlvbiBpc0xpbmVUZXJtaW5hdG9yKGNoKSB7XG4gICAgICAgIHJldHVybiAoY2ggPT09ICdcXG4nIHx8IGNoID09PSAnXFxyJyB8fCBjaCA9PT0gJ1xcdTIwMjgnIHx8IGNoID09PSAnXFx1MjAyOScpO1xuICAgIH1cblxuICAgIC8vIDcuNiBJZGVudGlmaWVyIE5hbWVzIGFuZCBJZGVudGlmaWVyc1xuXG4gICAgZnVuY3Rpb24gaXNJZGVudGlmaWVyU3RhcnQoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA9PT0gJyQnKSB8fCAoY2ggPT09ICdfJykgfHwgKGNoID09PSAnXFxcXCcpIHx8XG4gICAgICAgICAgICAoY2ggPj0gJ2EnICYmIGNoIDw9ICd6JykgfHwgKGNoID49ICdBJyAmJiBjaCA8PSAnWicpIHx8XG4gICAgICAgICAgICAoKGNoLmNoYXJDb2RlQXQoMCkgPj0gMHg4MCkgJiYgUmVnZXguTm9uQXNjaWlJZGVudGlmaWVyU3RhcnQudGVzdChjaCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzSWRlbnRpZmllclBhcnQoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA9PT0gJyQnKSB8fCAoY2ggPT09ICdfJykgfHwgKGNoID09PSAnXFxcXCcpIHx8XG4gICAgICAgICAgICAoY2ggPj0gJ2EnICYmIGNoIDw9ICd6JykgfHwgKGNoID49ICdBJyAmJiBjaCA8PSAnWicpIHx8XG4gICAgICAgICAgICAoKGNoID49ICcwJykgJiYgKGNoIDw9ICc5JykpIHx8XG4gICAgICAgICAgICAoKGNoLmNoYXJDb2RlQXQoMCkgPj0gMHg4MCkgJiYgUmVnZXguTm9uQXNjaWlJZGVudGlmaWVyUGFydC50ZXN0KGNoKSk7XG4gICAgfVxuXG4gICAgLy8gNy42LjEuMiBGdXR1cmUgUmVzZXJ2ZWQgV29yZHNcblxuICAgIGZ1bmN0aW9uIGlzRnV0dXJlUmVzZXJ2ZWRXb3JkKGlkKSB7XG4gICAgICAgIHN3aXRjaCAoaWQpIHtcblxuICAgICAgICAvLyBGdXR1cmUgcmVzZXJ2ZWQgd29yZHMuXG4gICAgICAgIGNhc2UgJ2NsYXNzJzpcbiAgICAgICAgY2FzZSAnZW51bSc6XG4gICAgICAgIGNhc2UgJ2V4cG9ydCc6XG4gICAgICAgIGNhc2UgJ2V4dGVuZHMnOlxuICAgICAgICBjYXNlICdpbXBvcnQnOlxuICAgICAgICBjYXNlICdzdXBlcic6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWQpIHtcbiAgICAgICAgc3dpdGNoIChpZCkge1xuXG4gICAgICAgIC8vIFN0cmljdCBNb2RlIHJlc2VydmVkIHdvcmRzLlxuICAgICAgICBjYXNlICdpbXBsZW1lbnRzJzpcbiAgICAgICAgY2FzZSAnaW50ZXJmYWNlJzpcbiAgICAgICAgY2FzZSAncGFja2FnZSc6XG4gICAgICAgIGNhc2UgJ3ByaXZhdGUnOlxuICAgICAgICBjYXNlICdwcm90ZWN0ZWQnOlxuICAgICAgICBjYXNlICdwdWJsaWMnOlxuICAgICAgICBjYXNlICdzdGF0aWMnOlxuICAgICAgICBjYXNlICd5aWVsZCc6XG4gICAgICAgIGNhc2UgJ2xldCc6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1Jlc3RyaWN0ZWRXb3JkKGlkKSB7XG4gICAgICAgIHJldHVybiBpZCA9PT0gJ2V2YWwnIHx8IGlkID09PSAnYXJndW1lbnRzJztcbiAgICB9XG5cbiAgICAvLyA3LjYuMS4xIEtleXdvcmRzXG5cbiAgICBmdW5jdGlvbiBpc0tleXdvcmQoaWQpIHtcbiAgICAgICAgdmFyIGtleXdvcmQgPSBmYWxzZTtcbiAgICAgICAgc3dpdGNoIChpZC5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAga2V5d29yZCA9IChpZCA9PT0gJ2lmJykgfHwgKGlkID09PSAnaW4nKSB8fCAoaWQgPT09ICdkbycpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIGtleXdvcmQgPSAoaWQgPT09ICd2YXInKSB8fCAoaWQgPT09ICdmb3InKSB8fCAoaWQgPT09ICduZXcnKSB8fCAoaWQgPT09ICd0cnknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICBrZXl3b3JkID0gKGlkID09PSAndGhpcycpIHx8IChpZCA9PT0gJ2Vsc2UnKSB8fCAoaWQgPT09ICdjYXNlJykgfHwgKGlkID09PSAndm9pZCcpIHx8IChpZCA9PT0gJ3dpdGgnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICBrZXl3b3JkID0gKGlkID09PSAnd2hpbGUnKSB8fCAoaWQgPT09ICdicmVhaycpIHx8IChpZCA9PT0gJ2NhdGNoJykgfHwgKGlkID09PSAndGhyb3cnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICBrZXl3b3JkID0gKGlkID09PSAncmV0dXJuJykgfHwgKGlkID09PSAndHlwZW9mJykgfHwgKGlkID09PSAnZGVsZXRlJykgfHwgKGlkID09PSAnc3dpdGNoJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAga2V5d29yZCA9IChpZCA9PT0gJ2RlZmF1bHQnKSB8fCAoaWQgPT09ICdmaW5hbGx5Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAga2V5d29yZCA9IChpZCA9PT0gJ2Z1bmN0aW9uJykgfHwgKGlkID09PSAnY29udGludWUnKSB8fCAoaWQgPT09ICdkZWJ1Z2dlcicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgICBrZXl3b3JkID0gKGlkID09PSAnaW5zdGFuY2VvZicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoa2V5d29yZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKGlkKSB7XG4gICAgICAgIC8vIEZ1dHVyZSByZXNlcnZlZCB3b3Jkcy5cbiAgICAgICAgLy8gJ2NvbnN0JyBpcyBzcGVjaWFsaXplZCBhcyBLZXl3b3JkIGluIFY4LlxuICAgICAgICBjYXNlICdjb25zdCc6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAvLyBGb3IgY29tcGF0aWJsaXR5IHRvIFNwaWRlck1vbmtleSBhbmQgRVMubmV4dFxuICAgICAgICBjYXNlICd5aWVsZCc6XG4gICAgICAgIGNhc2UgJ2xldCc6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdHJpY3QgJiYgaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKGlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXNGdXR1cmVSZXNlcnZlZFdvcmQoaWQpO1xuICAgIH1cblxuICAgIC8vIDcuNCBDb21tZW50c1xuXG4gICAgZnVuY3Rpb24gc2tpcENvbW1lbnQoKSB7XG4gICAgICAgIHZhciBjaCwgYmxvY2tDb21tZW50LCBsaW5lQ29tbWVudDtcblxuICAgICAgICBibG9ja0NvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgbGluZUNvbW1lbnQgPSBmYWxzZTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcblxuICAgICAgICAgICAgaWYgKGxpbmVDb21tZW50KSB7XG4gICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVDb21tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ1xccicgJiYgc291cmNlW2luZGV4XSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGJsb2NrQ29tbWVudCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICdcXHInICYmIHNvdXJjZVtpbmRleCArIDFdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICArK2xpbmVOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tDb21tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCArIDFdO1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDI7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVDb21tZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2tDb21tZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1doaXRlU3BhY2UoY2gpKSB7XG4gICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaCkpIHtcbiAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gICdcXHInICYmIHNvdXJjZVtpbmRleF0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICsrbGluZU51bWJlcjtcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FuSGV4RXNjYXBlKHByZWZpeCkge1xuICAgICAgICB2YXIgaSwgbGVuLCBjaCwgY29kZSA9IDA7XG5cbiAgICAgICAgbGVuID0gKHByZWZpeCA9PT0gJ3UnKSA/IDQgOiAyO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCAmJiBpc0hleERpZ2l0KHNvdXJjZVtpbmRleF0pKSB7XG4gICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiAxNiArICcwMTIzNDU2Nzg5YWJjZGVmJy5pbmRleE9mKGNoLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbklkZW50aWZpZXIoKSB7XG4gICAgICAgIHZhciBjaCwgc3RhcnQsIGlkLCByZXN0b3JlO1xuXG4gICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgaWYgKCFpc0lkZW50aWZpZXJTdGFydChjaCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXJ0ID0gaW5kZXg7XG4gICAgICAgIGlmIChjaCA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgaWYgKHNvdXJjZVtpbmRleF0gIT09ICd1Jykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICByZXN0b3JlID0gaW5kZXg7XG4gICAgICAgICAgICBjaCA9IHNjYW5IZXhFc2NhcGUoJ3UnKTtcbiAgICAgICAgICAgIGlmIChjaCkge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ1xcXFwnIHx8ICFpc0lkZW50aWZpZXJTdGFydChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZCA9IGNoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IHJlc3RvcmU7XG4gICAgICAgICAgICAgICAgaWQgPSAndSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNoID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgIGlmIChzb3VyY2VbaW5kZXhdICE9PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgIHJlc3RvcmUgPSBpbmRleDtcbiAgICAgICAgICAgICAgICBjaCA9IHNjYW5IZXhFc2NhcGUoJ3UnKTtcbiAgICAgICAgICAgICAgICBpZiAoY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAnXFxcXCcgfHwgIWlzSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWQgKz0gY2g7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSByZXN0b3JlO1xuICAgICAgICAgICAgICAgICAgICBpZCArPSAndSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZCArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGVyZSBpcyBubyBrZXl3b3JkIG9yIGxpdGVyYWwgd2l0aCBvbmx5IG9uZSBjaGFyYWN0ZXIuXG4gICAgICAgIC8vIFRodXMsIGl0IG11c3QgYmUgYW4gaWRlbnRpZmllci5cbiAgICAgICAgaWYgKGlkLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpZCxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0tleXdvcmQoaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLktleXdvcmQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlkLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gNy44LjEgTnVsbCBMaXRlcmFsc1xuXG4gICAgICAgIGlmIChpZCA9PT0gJ251bGwnKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLk51bGxMaXRlcmFsLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpZCxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDcuOC4yIEJvb2xlYW4gTGl0ZXJhbHNcblxuICAgICAgICBpZiAoaWQgPT09ICd0cnVlJyB8fCBpZCA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5Cb29sZWFuTGl0ZXJhbCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogaWQsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogVG9rZW4uSWRlbnRpZmllcixcbiAgICAgICAgICAgIHZhbHVlOiBpZCxcbiAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDcuNyBQdW5jdHVhdG9yc1xuXG4gICAgZnVuY3Rpb24gc2NhblB1bmN0dWF0b3IoKSB7XG4gICAgICAgIHZhciBzdGFydCA9IGluZGV4LFxuICAgICAgICAgICAgY2gxID0gc291cmNlW2luZGV4XSxcbiAgICAgICAgICAgIGNoMixcbiAgICAgICAgICAgIGNoMyxcbiAgICAgICAgICAgIGNoNDtcblxuICAgICAgICAvLyBDaGVjayBmb3IgbW9zdCBjb21tb24gc2luZ2xlLWNoYXJhY3RlciBwdW5jdHVhdG9ycy5cblxuICAgICAgICBpZiAoY2gxID09PSAnOycgfHwgY2gxID09PSAneycgfHwgY2gxID09PSAnfScpIHtcbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGNoMSxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaDEgPT09ICcsJyB8fCBjaDEgPT09ICcoJyB8fCBjaDEgPT09ICcpJykge1xuICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogY2gxLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG90ICguKSBjYW4gYWxzbyBzdGFydCBhIGZsb2F0aW5nLXBvaW50IG51bWJlciwgaGVuY2UgdGhlIG5lZWRcbiAgICAgICAgLy8gdG8gY2hlY2sgdGhlIG5leHQgY2hhcmFjdGVyLlxuXG4gICAgICAgIGNoMiA9IHNvdXJjZVtpbmRleCArIDFdO1xuICAgICAgICBpZiAoY2gxID09PSAnLicgJiYgIWlzRGVjaW1hbERpZ2l0KGNoMikpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogc291cmNlW2luZGV4KytdLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGVlayBtb3JlIGNoYXJhY3RlcnMuXG5cbiAgICAgICAgY2gzID0gc291cmNlW2luZGV4ICsgMl07XG4gICAgICAgIGNoNCA9IHNvdXJjZVtpbmRleCArIDNdO1xuXG4gICAgICAgIC8vIDQtY2hhcmFjdGVyIHB1bmN0dWF0b3I6ID4+Pj1cblxuICAgICAgICBpZiAoY2gxID09PSAnPicgJiYgY2gyID09PSAnPicgJiYgY2gzID09PSAnPicpIHtcbiAgICAgICAgICAgIGlmIChjaDQgPT09ICc9Jykge1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IDQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICc+Pj49JyxcbiAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAzLWNoYXJhY3RlciBwdW5jdHVhdG9yczogPT09ICE9PSA+Pj4gPDw9ID4+PVxuXG4gICAgICAgIGlmIChjaDEgPT09ICc9JyAmJiBjaDIgPT09ICc9JyAmJiBjaDMgPT09ICc9Jykge1xuICAgICAgICAgICAgaW5kZXggKz0gMztcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogJz09PScsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2gxID09PSAnIScgJiYgY2gyID09PSAnPScgJiYgY2gzID09PSAnPScpIHtcbiAgICAgICAgICAgIGluZGV4ICs9IDM7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICchPT0nLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoMSA9PT0gJz4nICYmIGNoMiA9PT0gJz4nICYmIGNoMyA9PT0gJz4nKSB7XG4gICAgICAgICAgICBpbmRleCArPSAzO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnPj4+JyxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaDEgPT09ICc8JyAmJiBjaDIgPT09ICc8JyAmJiBjaDMgPT09ICc9Jykge1xuICAgICAgICAgICAgaW5kZXggKz0gMztcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogJzw8PScsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2gxID09PSAnPicgJiYgY2gyID09PSAnPicgJiYgY2gzID09PSAnPScpIHtcbiAgICAgICAgICAgIGluZGV4ICs9IDM7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICc+Pj0nLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gMi1jaGFyYWN0ZXIgcHVuY3R1YXRvcnM6IDw9ID49ID09ICE9ICsrIC0tIDw8ID4+ICYmIHx8XG4gICAgICAgIC8vICs9IC09ICo9ICU9ICY9IHw9IF49IC89XG5cbiAgICAgICAgaWYgKGNoMiA9PT0gJz0nKSB7XG4gICAgICAgICAgICBpZiAoJzw+PSErLSolJnxeLycuaW5kZXhPZihjaDEpID49IDApIHtcbiAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjaDEgKyBjaDIsXG4gICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoMSA9PT0gY2gyICYmICgnKy08PiZ8Jy5pbmRleE9mKGNoMSkgPj0gMCkpIHtcbiAgICAgICAgICAgIGlmICgnKy08PiZ8Jy5pbmRleE9mKGNoMikgPj0gMCkge1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IDI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNoMSArIGNoMixcbiAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgcmVtYWluaW5nIDEtY2hhcmFjdGVyIHB1bmN0dWF0b3JzLlxuXG4gICAgICAgIGlmICgnW108PistKiUmfF4hfj86PS8nLmluZGV4T2YoY2gxKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHNvdXJjZVtpbmRleCsrXSxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIDcuOC4zIE51bWVyaWMgTGl0ZXJhbHNcblxuICAgIGZ1bmN0aW9uIHNjYW5OdW1lcmljTGl0ZXJhbCgpIHtcbiAgICAgICAgdmFyIG51bWJlciwgc3RhcnQsIGNoO1xuXG4gICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgYXNzZXJ0KGlzRGVjaW1hbERpZ2l0KGNoKSB8fCAoY2ggPT09ICcuJyksXG4gICAgICAgICAgICAnTnVtZXJpYyBsaXRlcmFsIG11c3Qgc3RhcnQgd2l0aCBhIGRlY2ltYWwgZGlnaXQgb3IgYSBkZWNpbWFsIHBvaW50Jyk7XG5cbiAgICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgICAgbnVtYmVyID0gJyc7XG4gICAgICAgIGlmIChjaCAhPT0gJy4nKSB7XG4gICAgICAgICAgICBudW1iZXIgPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG5cbiAgICAgICAgICAgIC8vIEhleCBudW1iZXIgc3RhcnRzIHdpdGggJzB4Jy5cbiAgICAgICAgICAgIC8vIE9jdGFsIG51bWJlciBzdGFydHMgd2l0aCAnMCcuXG4gICAgICAgICAgICBpZiAobnVtYmVyID09PSAnMCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICd4JyB8fCBjaCA9PT0gJ1gnKSB7XG4gICAgICAgICAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0hleERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChudW1iZXIubGVuZ3RoIDw9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgMHhcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uTnVtZXJpY0xpdGVyYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcGFyc2VJbnQobnVtYmVyLCAxNiksXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2N0YWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzT2N0YWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaCkgfHwgaXNEZWNpbWFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5OdW1lcmljTGl0ZXJhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZUludChudW1iZXIsIDgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2N0YWw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBkZWNpbWFsIG51bWJlciBzdGFydHMgd2l0aCAnMCcgc3VjaCBhcyAnMDknIGlzIGlsbGVnYWwuXG4gICAgICAgICAgICAgICAgaWYgKGlzRGVjaW1hbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKCFpc0RlY2ltYWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2ggPT09ICcuJykge1xuICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRGVjaW1hbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaCA9PT0gJ2UnIHx8IGNoID09PSAnRScpIHtcbiAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG5cbiAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJysnIHx8IGNoID09PSAnLScpIHtcbiAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICBpZiAoaXNEZWNpbWFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRGVjaW1hbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNoID0gJ2NoYXJhY3RlciAnICsgY2g7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjaCA9ICc8ZW5kPic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBUb2tlbi5OdW1lcmljTGl0ZXJhbCxcbiAgICAgICAgICAgIHZhbHVlOiBwYXJzZUZsb2F0KG51bWJlciksXG4gICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyA3LjguNCBTdHJpbmcgTGl0ZXJhbHNcblxuICAgIGZ1bmN0aW9uIHNjYW5TdHJpbmdMaXRlcmFsKCkge1xuICAgICAgICB2YXIgc3RyID0gJycsIHF1b3RlLCBzdGFydCwgY2gsIGNvZGUsIHVuZXNjYXBlZCwgcmVzdG9yZSwgb2N0YWwgPSBmYWxzZTtcblxuICAgICAgICBxdW90ZSA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgIGFzc2VydCgocXVvdGUgPT09ICdcXCcnIHx8IHF1b3RlID09PSAnXCInKSxcbiAgICAgICAgICAgICdTdHJpbmcgbGl0ZXJhbCBtdXN0IHN0YXJ0cyB3aXRoIGEgcXVvdGUnKTtcblxuICAgICAgICBzdGFydCA9IGluZGV4O1xuICAgICAgICArK2luZGV4O1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG5cbiAgICAgICAgICAgIGlmIChjaCA9PT0gcXVvdGUpIHtcbiAgICAgICAgICAgICAgICBxdW90ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgaWYgKCFpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3InOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXHInO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3QnOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXHQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3UnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICd4JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmUgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuZXNjYXBlZCA9IHNjYW5IZXhFc2NhcGUoY2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVuZXNjYXBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSB1bmVzY2FwZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gcmVzdG9yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcYic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcZic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xceDBCJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNPY3RhbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSAnMDEyMzQ1NjcnLmluZGV4T2YoY2gpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXFwwIGlzIG5vdCBvY3RhbCBlc2NhcGUgc2VxdWVuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvY3RhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgbGVuZ3RoICYmIGlzT2N0YWxEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvY3RhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlICogOCArICcwMTIzNDU2NycuaW5kZXhPZihzb3VyY2VbaW5kZXgrK10pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDMgZGlnaXRzIGFyZSBvbmx5IGFsbG93ZWQgd2hlbiBzdHJpbmcgc3RhcnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpdGggMCwgMSwgMiwgM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJzAxMjMnLmluZGV4T2YoY2gpID49IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA8IGxlbmd0aCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzT2N0YWxEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiA4ICsgJzAxMjM0NTY3Jy5pbmRleE9mKHNvdXJjZVtpbmRleCsrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICAnXFxyJyAmJiBzb3VyY2VbaW5kZXhdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaCkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHF1b3RlICE9PSAnJykge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFRva2VuLlN0cmluZ0xpdGVyYWwsXG4gICAgICAgICAgICB2YWx1ZTogc3RyLFxuICAgICAgICAgICAgb2N0YWw6IG9jdGFsLFxuICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhblJlZ0V4cCgpIHtcbiAgICAgICAgdmFyIHN0ciwgY2gsIHN0YXJ0LCBwYXR0ZXJuLCBmbGFncywgdmFsdWUsIGNsYXNzTWFya2VyID0gZmFsc2UsIHJlc3RvcmUsIHRlcm1pbmF0ZWQgPSBmYWxzZTtcblxuICAgICAgICBidWZmZXIgPSBudWxsO1xuICAgICAgICBza2lwQ29tbWVudCgpO1xuXG4gICAgICAgIHN0YXJ0ID0gaW5kZXg7XG4gICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgYXNzZXJ0KGNoID09PSAnLycsICdSZWd1bGFyIGV4cHJlc3Npb24gbGl0ZXJhbCBtdXN0IHN0YXJ0IHdpdGggYSBzbGFzaCcpO1xuICAgICAgICBzdHIgPSBzb3VyY2VbaW5kZXgrK107XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW50ZXJtaW5hdGVkUmVnRXhwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc01hcmtlcikge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTWFya2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVudGVybWluYXRlZFJlZ0V4cCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0ZXJtaW5hdGVkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbnRlcm1pbmF0ZWRSZWdFeHApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXhjbHVkZSBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaC5cbiAgICAgICAgcGF0dGVybiA9IHN0ci5zdWJzdHIoMSwgc3RyLmxlbmd0aCAtIDIpO1xuXG4gICAgICAgIGZsYWdzID0gJyc7XG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgaWYgKGNoID09PSAnXFxcXCcgJiYgaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgcmVzdG9yZSA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBjaCA9IHNjYW5IZXhFc2NhcGUoJ3UnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncyArPSBjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxcXHUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICg7IHJlc3RvcmUgPCBpbmRleDsgKytyZXN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IHNvdXJjZVtyZXN0b3JlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gcmVzdG9yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICs9ICd1JztcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxcXHUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXFxcJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZsYWdzICs9IGNoO1xuICAgICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ldyBSZWdFeHAocGF0dGVybiwgZmxhZ3MpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbnZhbGlkUmVnRXhwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsaXRlcmFsOiBzdHIsXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0lkZW50aWZpZXJOYW1lKHRva2VuKSB7XG4gICAgICAgIHJldHVybiB0b2tlbi50eXBlID09PSBUb2tlbi5JZGVudGlmaWVyIHx8XG4gICAgICAgICAgICB0b2tlbi50eXBlID09PSBUb2tlbi5LZXl3b3JkIHx8XG4gICAgICAgICAgICB0b2tlbi50eXBlID09PSBUb2tlbi5Cb29sZWFuTGl0ZXJhbCB8fFxuICAgICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW4uTnVsbExpdGVyYWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWR2YW5jZSgpIHtcbiAgICAgICAgdmFyIGNoLCB0b2tlbjtcblxuICAgICAgICBza2lwQ29tbWVudCgpO1xuXG4gICAgICAgIGlmIChpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uRU9GLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtpbmRleCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdG9rZW4gPSBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICBpZiAodHlwZW9mIHRva2VuICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuXG4gICAgICAgIGlmIChjaCA9PT0gJ1xcJycgfHwgY2ggPT09ICdcIicpIHtcbiAgICAgICAgICAgIHJldHVybiBzY2FuU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoID09PSAnLicgfHwgaXNEZWNpbWFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICByZXR1cm4gc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0b2tlbiA9IHNjYW5JZGVudGlmaWVyKCk7XG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGV4KCkge1xuICAgICAgICB2YXIgdG9rZW47XG5cbiAgICAgICAgaWYgKGJ1ZmZlcikge1xuICAgICAgICAgICAgaW5kZXggPSBidWZmZXIucmFuZ2VbMV07XG4gICAgICAgICAgICBsaW5lTnVtYmVyID0gYnVmZmVyLmxpbmVOdW1iZXI7XG4gICAgICAgICAgICBsaW5lU3RhcnQgPSBidWZmZXIubGluZVN0YXJ0O1xuICAgICAgICAgICAgdG9rZW4gPSBidWZmZXI7XG4gICAgICAgICAgICBidWZmZXIgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICB9XG5cbiAgICAgICAgYnVmZmVyID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGFkdmFuY2UoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb29rYWhlYWQoKSB7XG4gICAgICAgIHZhciBwb3MsIGxpbmUsIHN0YXJ0O1xuXG4gICAgICAgIGlmIChidWZmZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBidWZmZXI7XG4gICAgICAgIH1cblxuICAgICAgICBwb3MgPSBpbmRleDtcbiAgICAgICAgbGluZSA9IGxpbmVOdW1iZXI7XG4gICAgICAgIHN0YXJ0ID0gbGluZVN0YXJ0O1xuICAgICAgICBidWZmZXIgPSBhZHZhbmNlKCk7XG4gICAgICAgIGluZGV4ID0gcG9zO1xuICAgICAgICBsaW5lTnVtYmVyID0gbGluZTtcbiAgICAgICAgbGluZVN0YXJ0ID0gc3RhcnQ7XG5cbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGVyZSBpcyBhIGxpbmUgdGVybWluYXRvciBiZWZvcmUgdGhlIG5leHQgdG9rZW4uXG5cbiAgICBmdW5jdGlvbiBwZWVrTGluZVRlcm1pbmF0b3IoKSB7XG4gICAgICAgIHZhciBwb3MsIGxpbmUsIHN0YXJ0LCBmb3VuZDtcblxuICAgICAgICBwb3MgPSBpbmRleDtcbiAgICAgICAgbGluZSA9IGxpbmVOdW1iZXI7XG4gICAgICAgIHN0YXJ0ID0gbGluZVN0YXJ0O1xuICAgICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgICBmb3VuZCA9IGxpbmVOdW1iZXIgIT09IGxpbmU7XG4gICAgICAgIGluZGV4ID0gcG9zO1xuICAgICAgICBsaW5lTnVtYmVyID0gbGluZTtcbiAgICAgICAgbGluZVN0YXJ0ID0gc3RhcnQ7XG5cbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH1cblxuICAgIC8vIFRocm93IGFuIGV4Y2VwdGlvblxuXG4gICAgZnVuY3Rpb24gdGhyb3dFcnJvcih0b2tlbiwgbWVzc2FnZUZvcm1hdCkge1xuICAgICAgICB2YXIgZXJyb3IsXG4gICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSxcbiAgICAgICAgICAgIG1zZyA9IG1lc3NhZ2VGb3JtYXQucmVwbGFjZShcbiAgICAgICAgICAgICAgICAvJShcXGQpL2csXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHdob2xlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1tpbmRleF0gfHwgJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBpZiAodHlwZW9mIHRva2VuLmxpbmVOdW1iZXIgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcignTGluZSAnICsgdG9rZW4ubGluZU51bWJlciArICc6ICcgKyBtc2cpO1xuICAgICAgICAgICAgZXJyb3IuaW5kZXggPSB0b2tlbi5yYW5nZVswXTtcbiAgICAgICAgICAgIGVycm9yLmxpbmVOdW1iZXIgPSB0b2tlbi5saW5lTnVtYmVyO1xuICAgICAgICAgICAgZXJyb3IuY29sdW1uID0gdG9rZW4ucmFuZ2VbMF0gLSBsaW5lU3RhcnQgKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0xpbmUgJyArIGxpbmVOdW1iZXIgKyAnOiAnICsgbXNnKTtcbiAgICAgICAgICAgIGVycm9yLmluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICBlcnJvci5saW5lTnVtYmVyID0gbGluZU51bWJlcjtcbiAgICAgICAgICAgIGVycm9yLmNvbHVtbiA9IGluZGV4IC0gbGluZVN0YXJ0ICsgMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRocm93RXJyb3JUb2xlcmFudCgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93RXJyb3IuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGV4dHJhLmVycm9ycykge1xuICAgICAgICAgICAgICAgIGV4dHJhLmVycm9ycy5wdXNoKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvLyBUaHJvdyBhbiBleGNlcHRpb24gYmVjYXVzZSBvZiB0aGUgdG9rZW4uXG5cbiAgICBmdW5jdGlvbiB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pIHtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZEVPUyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uTnVtZXJpY0xpdGVyYWwpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWROdW1iZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRTdHJpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRJZGVudGlmaWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgICBpZiAoaXNGdXR1cmVSZXNlcnZlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFJlc2VydmVkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlN0cmljdFJlc2VydmVkV29yZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCB0b2tlbi52YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCb29sZWFuTGl0ZXJhbCwgTnVsbExpdGVyYWwsIG9yIFB1bmN0dWF0b3IuXG4gICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgdG9rZW4udmFsdWUpO1xuICAgIH1cblxuICAgIC8vIEV4cGVjdCB0aGUgbmV4dCB0b2tlbiB0byBtYXRjaCB0aGUgc3BlY2lmaWVkIHB1bmN0dWF0b3IuXG4gICAgLy8gSWYgbm90LCBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uXG5cbiAgICBmdW5jdGlvbiBleHBlY3QodmFsdWUpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yIHx8IHRva2VuLnZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEV4cGVjdCB0aGUgbmV4dCB0b2tlbiB0byBtYXRjaCB0aGUgc3BlY2lmaWVkIGtleXdvcmQuXG4gICAgLy8gSWYgbm90LCBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uXG5cbiAgICBmdW5jdGlvbiBleHBlY3RLZXl3b3JkKGtleXdvcmQpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5LZXl3b3JkIHx8IHRva2VuLnZhbHVlICE9PSBrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgdGhlIG5leHQgdG9rZW4gbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIHB1bmN0dWF0b3IuXG5cbiAgICBmdW5jdGlvbiBtYXRjaCh2YWx1ZSkge1xuICAgICAgICB2YXIgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgcmV0dXJuIHRva2VuLnR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IgJiYgdG9rZW4udmFsdWUgPT09IHZhbHVlO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0cnVlIGlmIHRoZSBuZXh0IHRva2VuIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBrZXl3b3JkXG5cbiAgICBmdW5jdGlvbiBtYXRjaEtleXdvcmQoa2V5d29yZCkge1xuICAgICAgICB2YXIgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgcmV0dXJuIHRva2VuLnR5cGUgPT09IFRva2VuLktleXdvcmQgJiYgdG9rZW4udmFsdWUgPT09IGtleXdvcmQ7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgdGhlIG5leHQgdG9rZW4gaXMgYW4gYXNzaWdubWVudCBvcGVyYXRvclxuXG4gICAgZnVuY3Rpb24gbWF0Y2hBc3NpZ24oKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxvb2thaGVhZCgpLFxuICAgICAgICAgICAgb3AgPSB0b2tlbi52YWx1ZTtcblxuICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uUHVuY3R1YXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcCA9PT0gJz0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJyo9JyB8fFxuICAgICAgICAgICAgb3AgPT09ICcvPScgfHxcbiAgICAgICAgICAgIG9wID09PSAnJT0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJys9JyB8fFxuICAgICAgICAgICAgb3AgPT09ICctPScgfHxcbiAgICAgICAgICAgIG9wID09PSAnPDw9JyB8fFxuICAgICAgICAgICAgb3AgPT09ICc+Pj0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJz4+Pj0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJyY9JyB8fFxuICAgICAgICAgICAgb3AgPT09ICdePScgfHxcbiAgICAgICAgICAgIG9wID09PSAnfD0nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbnN1bWVTZW1pY29sb24oKSB7XG4gICAgICAgIHZhciB0b2tlbiwgbGluZTtcblxuICAgICAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdC5cbiAgICAgICAgaWYgKHNvdXJjZVtpbmRleF0gPT09ICc7Jykge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsaW5lID0gbGluZU51bWJlcjtcbiAgICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgICAgaWYgKGxpbmVOdW1iZXIgIT09IGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtYXRjaCgnOycpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5FT0YgJiYgIW1hdGNoKCd9JykpIHtcbiAgICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiBwcm92aWRlZCBleHByZXNzaW9uIGlzIExlZnRIYW5kU2lkZUV4cHJlc3Npb25cblxuICAgIGZ1bmN0aW9uIGlzTGVmdEhhbmRTaWRlKGV4cHIpIHtcbiAgICAgICAgcmV0dXJuIGV4cHIudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIgfHwgZXhwci50eXBlID09PSBTeW50YXguTWVtYmVyRXhwcmVzc2lvbjtcbiAgICB9XG5cbiAgICAvLyAxMS4xLjQgQXJyYXkgSW5pdGlhbGlzZXJcblxuICAgIGZ1bmN0aW9uIHBhcnNlQXJyYXlJbml0aWFsaXNlcigpIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gW107XG5cbiAgICAgICAgZXhwZWN0KCdbJyk7XG5cbiAgICAgICAgd2hpbGUgKCFtYXRjaCgnXScpKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJywnKSkge1xuICAgICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2gocGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKTtcblxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2goJ10nKSkge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3QoJywnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QoJ10nKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkFycmF5RXhwcmVzc2lvbixcbiAgICAgICAgICAgIGVsZW1lbnRzOiBlbGVtZW50c1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDExLjEuNSBPYmplY3QgSW5pdGlhbGlzZXJcblxuICAgIGZ1bmN0aW9uIHBhcnNlUHJvcGVydHlGdW5jdGlvbihwYXJhbSwgZmlyc3QpIHtcbiAgICAgICAgdmFyIHByZXZpb3VzU3RyaWN0LCBib2R5O1xuXG4gICAgICAgIHByZXZpb3VzU3RyaWN0ID0gc3RyaWN0O1xuICAgICAgICBib2R5ID0gcGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzKCk7XG4gICAgICAgIGlmIChmaXJzdCAmJiBzdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChwYXJhbVswXS5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KGZpcnN0LCBNZXNzYWdlcy5TdHJpY3RQYXJhbU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguRnVuY3Rpb25FeHByZXNzaW9uLFxuICAgICAgICAgICAgaWQ6IG51bGwsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtLFxuICAgICAgICAgICAgZGVmYXVsdHM6IFtdLFxuICAgICAgICAgICAgYm9keTogYm9keSxcbiAgICAgICAgICAgIHJlc3Q6IG51bGwsXG4gICAgICAgICAgICBnZW5lcmF0b3I6IGZhbHNlLFxuICAgICAgICAgICAgZXhwcmVzc2lvbjogZmFsc2VcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCkge1xuICAgICAgICB2YXIgdG9rZW4gPSBsZXgoKTtcblxuICAgICAgICAvLyBOb3RlOiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbmx5IGZyb20gcGFyc2VPYmplY3RQcm9wZXJ0eSgpLCB3aGVyZVxuICAgICAgICAvLyBFT0YgYW5kIFB1bmN0dWF0b3IgdG9rZW5zIGFyZSBhbHJlYWR5IGZpbHRlcmVkIG91dC5cblxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCB8fCB0b2tlbi50eXBlID09PSBUb2tlbi5OdW1lcmljTGl0ZXJhbCkge1xuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiB0b2tlbi5vY3RhbCkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuU3RyaWN0T2N0YWxMaXRlcmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVMaXRlcmFsKHRva2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguSWRlbnRpZmllcixcbiAgICAgICAgICAgIG5hbWU6IHRva2VuLnZhbHVlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VPYmplY3RQcm9wZXJ0eSgpIHtcbiAgICAgICAgdmFyIHRva2VuLCBrZXksIGlkLCBwYXJhbTtcblxuICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuXG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5JZGVudGlmaWVyKSB7XG5cbiAgICAgICAgICAgIGlkID0gcGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuXG4gICAgICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cblxuICAgICAgICAgICAgaWYgKHRva2VuLnZhbHVlID09PSAnZ2V0JyAmJiAhbWF0Y2goJzonKSkge1xuICAgICAgICAgICAgICAgIGtleSA9IHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoJygnKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoJyknKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguUHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcGFyc2VQcm9wZXJ0eUZ1bmN0aW9uKFtdKSxcbiAgICAgICAgICAgICAgICAgICAga2luZDogJ2dldCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0b2tlbi52YWx1ZSA9PT0gJ3NldCcgJiYgIW1hdGNoKCc6JykpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgICAgICAgICAgICAgZXhwZWN0KCcoJyk7XG4gICAgICAgICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3QoJyknKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sIHRva2VuLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Qcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHBhcnNlUHJvcGVydHlGdW5jdGlvbihbXSksXG4gICAgICAgICAgICAgICAgICAgICAgICBraW5kOiAnc2V0J1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtID0gWyBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpIF07XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdCgnKScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcGFyc2VQcm9wZXJ0eUZ1bmN0aW9uKHBhcmFtLCB0b2tlbiksXG4gICAgICAgICAgICAgICAgICAgICAgICBraW5kOiAnc2V0J1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGlkLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpLFxuICAgICAgICAgICAgICAgICAgICBraW5kOiAnaW5pdCdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLkVPRiB8fCB0b2tlbi50eXBlID09PSBUb2tlbi5QdW5jdHVhdG9yKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5ID0gcGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Qcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpLFxuICAgICAgICAgICAgICAgIGtpbmQ6ICdpbml0J1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlT2JqZWN0SW5pdGlhbGlzZXIoKSB7XG4gICAgICAgIHZhciBwcm9wZXJ0aWVzID0gW10sIHByb3BlcnR5LCBuYW1lLCBraW5kLCBtYXAgPSB7fSwgdG9TdHJpbmcgPSBTdHJpbmc7XG5cbiAgICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgICAgd2hpbGUgKCFtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICBwcm9wZXJ0eSA9IHBhcnNlT2JqZWN0UHJvcGVydHkoKTtcblxuICAgICAgICAgICAgaWYgKHByb3BlcnR5LmtleS50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBwcm9wZXJ0eS5rZXkubmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IHRvU3RyaW5nKHByb3BlcnR5LmtleS52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBraW5kID0gKHByb3BlcnR5LmtpbmQgPT09ICdpbml0JykgPyBQcm9wZXJ0eUtpbmQuRGF0YSA6IChwcm9wZXJ0eS5raW5kID09PSAnZ2V0JykgPyBQcm9wZXJ0eUtpbmQuR2V0IDogUHJvcGVydHlLaW5kLlNldDtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWFwLCBuYW1lKSkge1xuICAgICAgICAgICAgICAgIGlmIChtYXBbbmFtZV0gPT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJpY3QgJiYga2luZCA9PT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuU3RyaWN0RHVwbGljYXRlUHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtpbmQgIT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkFjY2Vzc29yRGF0YVByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChraW5kID09PSBQcm9wZXJ0eUtpbmQuRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5BY2Nlc3NvckRhdGFQcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWFwW25hbWVdICYga2luZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5BY2Nlc3NvckdldFNldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbWFwW25hbWVdIHw9IGtpbmQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hcFtuYW1lXSA9IGtpbmQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByb3BlcnRpZXMucHVzaChwcm9wZXJ0eSk7XG5cbiAgICAgICAgICAgIGlmICghbWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgICAgIGV4cGVjdCgnLCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCd9Jyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5PYmplY3RFeHByZXNzaW9uLFxuICAgICAgICAgICAgcHJvcGVydGllczogcHJvcGVydGllc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDExLjEuNiBUaGUgR3JvdXBpbmcgT3BlcmF0b3JcblxuICAgIGZ1bmN0aW9uIHBhcnNlR3JvdXBFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgZXhwcjtcblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG5cbiAgICAvLyAxMS4xIFByaW1hcnkgRXhwcmVzc2lvbnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxvb2thaGVhZCgpLFxuICAgICAgICAgICAgdHlwZSA9IHRva2VuLnR5cGU7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgbmFtZTogbGV4KCkudmFsdWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCB8fCB0eXBlID09PSBUb2tlbi5OdW1lcmljTGl0ZXJhbCkge1xuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiB0b2tlbi5vY3RhbCkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuU3RyaWN0T2N0YWxMaXRlcmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVMaXRlcmFsKGxleCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCd0aGlzJykpIHtcbiAgICAgICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguVGhpc0V4cHJlc3Npb25cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRnVuY3Rpb25FeHByZXNzaW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gVG9rZW4uQm9vbGVhbkxpdGVyYWwpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgdG9rZW4udmFsdWUgPSAodG9rZW4udmFsdWUgPT09ICd0cnVlJyk7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlTGl0ZXJhbCh0b2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gVG9rZW4uTnVsbExpdGVyYWwpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgdG9rZW4udmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUxpdGVyYWwodG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoKCdbJykpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUFycmF5SW5pdGlhbGlzZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtYXRjaCgneycpKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VPYmplY3RJbml0aWFsaXNlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoKCcoJykpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUdyb3VwRXhwcmVzc2lvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoKCcvJykgfHwgbWF0Y2goJy89JykpIHtcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVMaXRlcmFsKHNjYW5SZWdFeHAoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhyb3dVbmV4cGVjdGVkKGxleCgpKTtcbiAgICB9XG5cbiAgICAvLyAxMS4yIExlZnQtSGFuZC1TaWRlIEV4cHJlc3Npb25zXG5cbiAgICBmdW5jdGlvbiBwYXJzZUFyZ3VtZW50cygpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICBpZiAoIW1hdGNoKCcpJykpIHtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBleHBlY3QoJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIHJldHVybiBhcmdzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSgpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG5cbiAgICAgICAgaWYgKCFpc0lkZW50aWZpZXJOYW1lKHRva2VuKSkge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguSWRlbnRpZmllcixcbiAgICAgICAgICAgIG5hbWU6IHRva2VuLnZhbHVlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICAgICAgZXhwZWN0KCcuJyk7XG5cbiAgICAgICAgcmV0dXJuIHBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlQ29tcHV0ZWRNZW1iZXIoKSB7XG4gICAgICAgIHZhciBleHByO1xuXG4gICAgICAgIGV4cGVjdCgnWycpO1xuXG4gICAgICAgIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICBleHBlY3QoJ10nKTtcblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZU5ld0V4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ25ldycpO1xuXG4gICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguTmV3RXhwcmVzc2lvbixcbiAgICAgICAgICAgIGNhbGxlZTogcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCksXG4gICAgICAgICAgICAnYXJndW1lbnRzJzogW11cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgICAgZXhwclsnYXJndW1lbnRzJ10gPSBwYXJzZUFyZ3VtZW50cygpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsKCkge1xuICAgICAgICB2YXIgZXhwcjtcblxuICAgICAgICBleHByID0gbWF0Y2hLZXl3b3JkKCduZXcnKSA/IHBhcnNlTmV3RXhwcmVzc2lvbigpIDogcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnLicpIHx8IG1hdGNoKCdbJykgfHwgbWF0Y2goJygnKSkge1xuICAgICAgICAgICAgaWYgKG1hdGNoKCcoJykpIHtcbiAgICAgICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQ2FsbEV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgIGNhbGxlZTogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgJ2FyZ3VtZW50cyc6IHBhcnNlQXJndW1lbnRzKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCgnWycpKSB7XG4gICAgICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4Lk1lbWJlckV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IGV4cHIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiBwYXJzZUNvbXB1dGVkTWVtYmVyKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTWVtYmVyRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IGV4cHIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByO1xuXG4gICAgICAgIGV4cHIgPSBtYXRjaEtleXdvcmQoJ25ldycpID8gcGFyc2VOZXdFeHByZXNzaW9uKCkgOiBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoKCcuJykgfHwgbWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgaWYgKG1hdGNoKCdbJykpIHtcbiAgICAgICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTWVtYmVyRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHBhcnNlQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS4zIFBvc3RmaXggRXhwcmVzc2lvbnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsKCksIHRva2VuO1xuXG4gICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhwcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgobWF0Y2goJysrJykgfHwgbWF0Y2goJy0tJykpICYmICFwZWVrTGluZVRlcm1pbmF0b3IoKSkge1xuICAgICAgICAgICAgLy8gMTEuMy4xLCAxMS4zLjJcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllciAmJiBpc1Jlc3RyaWN0ZWRXb3JkKGV4cHIubmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlN0cmljdExIU1Bvc3RmaXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc0xlZnRIYW5kU2lkZShleHByKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuSW52YWxpZExIU0luQXNzaWdubWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlVwZGF0ZUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGxleCgpLnZhbHVlLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50OiBleHByLFxuICAgICAgICAgICAgICAgIHByZWZpeDogZmFsc2VcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS40IFVuYXJ5IE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VVbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciB0b2tlbiwgZXhwcjtcblxuICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uUHVuY3R1YXRvciAmJiB0b2tlbi50eXBlICE9PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoKCcrKycpIHx8IG1hdGNoKCctLScpKSB7XG4gICAgICAgICAgICB0b2tlbiA9IGxleCgpO1xuICAgICAgICAgICAgZXhwciA9IHBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICAvLyAxMS40LjQsIDExLjQuNVxuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBleHByLnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuU3RyaWN0TEhTUHJlZml4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc0xlZnRIYW5kU2lkZShleHByKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuSW52YWxpZExIU0luQXNzaWdubWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlVwZGF0ZUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IHRva2VuLnZhbHVlLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50OiBleHByLFxuICAgICAgICAgICAgICAgIHByZWZpeDogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBleHByO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoKCcrJykgfHwgbWF0Y2goJy0nKSB8fCBtYXRjaCgnficpIHx8IG1hdGNoKCchJykpIHtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlVuYXJ5RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogbGV4KCkudmFsdWUsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQ6IHBhcnNlVW5hcnlFeHByZXNzaW9uKCksXG4gICAgICAgICAgICAgICAgcHJlZml4OiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCdkZWxldGUnKSB8fCBtYXRjaEtleXdvcmQoJ3ZvaWQnKSB8fCBtYXRjaEtleXdvcmQoJ3R5cGVvZicpKSB7XG4gICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5VbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGxleCgpLnZhbHVlLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50OiBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpLFxuICAgICAgICAgICAgICAgIHByZWZpeDogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgZXhwci5vcGVyYXRvciA9PT0gJ2RlbGV0ZScgJiYgZXhwci5hcmd1bWVudC50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuU3RyaWN0RGVsZXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleHByO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICAvLyAxMS41IE11bHRpcGxpY2F0aXZlIE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VNdWx0aXBsaWNhdGl2ZUV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJyonKSB8fCBtYXRjaCgnLycpIHx8IG1hdGNoKCclJykpIHtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJpbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGxleCgpLnZhbHVlLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBhcnNlVW5hcnlFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS42IEFkZGl0aXZlIE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VBZGRpdGl2ZUV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VNdWx0aXBsaWNhdGl2ZUV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJysnKSB8fCBtYXRjaCgnLScpKSB7XG4gICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5CaW5hcnlFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBsZXgoKS52YWx1ZSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBleHByLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYXJzZU11bHRpcGxpY2F0aXZlRXhwcmVzc2lvbigpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgLy8gMTEuNyBCaXR3aXNlIFNoaWZ0IE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VTaGlmdEV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VBZGRpdGl2ZUV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJzw8JykgfHwgbWF0Y2goJz4+JykgfHwgbWF0Y2goJz4+PicpKSB7XG4gICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5CaW5hcnlFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBsZXgoKS52YWx1ZSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBleHByLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYXJzZUFkZGl0aXZlRXhwcmVzc2lvbigpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuICAgIC8vIDExLjggUmVsYXRpb25hbCBPcGVyYXRvcnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlUmVsYXRpb25hbEV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByLCBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgcHJldmlvdXNBbGxvd0luID0gc3RhdGUuYWxsb3dJbjtcbiAgICAgICAgc3RhdGUuYWxsb3dJbiA9IHRydWU7XG5cbiAgICAgICAgZXhwciA9IHBhcnNlU2hpZnRFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoKCc8JykgfHwgbWF0Y2goJz4nKSB8fCBtYXRjaCgnPD0nKSB8fCBtYXRjaCgnPj0nKSB8fCAocHJldmlvdXNBbGxvd0luICYmIG1hdGNoS2V5d29yZCgnaW4nKSkgfHwgbWF0Y2hLZXl3b3JkKCdpbnN0YW5jZW9mJykpIHtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJpbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGxleCgpLnZhbHVlLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBhcnNlU2hpZnRFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZS5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS45IEVxdWFsaXR5IE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VFcXVhbGl0eUV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VSZWxhdGlvbmFsRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnPT0nKSB8fCBtYXRjaCgnIT0nKSB8fCBtYXRjaCgnPT09JykgfHwgbWF0Y2goJyE9PScpKSB7XG4gICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5CaW5hcnlFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBsZXgoKS52YWx1ZSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBleHByLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYXJzZVJlbGF0aW9uYWxFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS4xMCBCaW5hcnkgQml0d2lzZSBPcGVyYXRvcnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlQml0d2lzZUFOREV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VFcXVhbGl0eUV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJyYnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5CaW5hcnlFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiAnJicsXG4gICAgICAgICAgICAgICAgbGVmdDogZXhwcixcbiAgICAgICAgICAgICAgICByaWdodDogcGFyc2VFcXVhbGl0eUV4cHJlc3Npb24oKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlQml0d2lzZVhPUkV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VCaXR3aXNlQU5ERXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnXicpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJpbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6ICdeJyxcbiAgICAgICAgICAgICAgICBsZWZ0OiBleHByLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYXJzZUJpdHdpc2VBTkRFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUJpdHdpc2VPUkV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VCaXR3aXNlWE9SRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnfCcpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJpbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6ICd8JyxcbiAgICAgICAgICAgICAgICBsZWZ0OiBleHByLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYXJzZUJpdHdpc2VYT1JFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS4xMSBCaW5hcnkgTG9naWNhbCBPcGVyYXRvcnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlTG9naWNhbEFOREV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VCaXR3aXNlT1JFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoKCcmJicpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkxvZ2ljYWxFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiAnJiYnLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBhcnNlQml0d2lzZU9SRXhwcmVzc2lvbigpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VMb2dpY2FsT1JFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgZXhwciA9IHBhcnNlTG9naWNhbEFOREV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJ3x8JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTG9naWNhbEV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6ICd8fCcsXG4gICAgICAgICAgICAgICAgbGVmdDogZXhwcixcbiAgICAgICAgICAgICAgICByaWdodDogcGFyc2VMb2dpY2FsQU5ERXhwcmVzc2lvbigpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgLy8gMTEuMTIgQ29uZGl0aW9uYWwgT3BlcmF0b3JcblxuICAgIGZ1bmN0aW9uIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgZXhwciwgcHJldmlvdXNBbGxvd0luLCBjb25zZXF1ZW50O1xuXG4gICAgICAgIGV4cHIgPSBwYXJzZUxvZ2ljYWxPUkV4cHJlc3Npb24oKTtcblxuICAgICAgICBpZiAobWF0Y2goJz8nKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICBwcmV2aW91c0FsbG93SW4gPSBzdGF0ZS5hbGxvd0luO1xuICAgICAgICAgICAgc3RhdGUuYWxsb3dJbiA9IHRydWU7XG4gICAgICAgICAgICBjb25zZXF1ZW50ID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgc3RhdGUuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcbiAgICAgICAgICAgIGV4cGVjdCgnOicpO1xuXG4gICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Db25kaXRpb25hbEV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgdGVzdDogZXhwcixcbiAgICAgICAgICAgICAgICBjb25zZXF1ZW50OiBjb25zZXF1ZW50LFxuICAgICAgICAgICAgICAgIGFsdGVybmF0ZTogcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgLy8gMTEuMTMgQXNzaWdubWVudCBPcGVyYXRvcnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciB0b2tlbiwgZXhwcjtcblxuICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICBleHByID0gcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKTtcblxuICAgICAgICBpZiAobWF0Y2hBc3NpZ24oKSkge1xuICAgICAgICAgICAgLy8gTGVmdEhhbmRTaWRlRXhwcmVzc2lvblxuICAgICAgICAgICAgaWYgKCFpc0xlZnRIYW5kU2lkZShleHByKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuSW52YWxpZExIU0luQXNzaWdubWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIDExLjEzLjFcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllciAmJiBpc1Jlc3RyaWN0ZWRXb3JkKGV4cHIubmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlN0cmljdExIU0Fzc2lnbm1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Bc3NpZ25tZW50RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogbGV4KCkudmFsdWUsXG4gICAgICAgICAgICAgICAgbGVmdDogZXhwcixcbiAgICAgICAgICAgICAgICByaWdodDogcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgLy8gMTEuMTQgQ29tbWEgT3BlcmF0b3JcblxuICAgIGZ1bmN0aW9uIHBhcnNlRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgaWYgKG1hdGNoKCcsJykpIHtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlNlcXVlbmNlRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uczogWyBleHByIF1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2goJywnKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICAgICAgZXhwci5leHByZXNzaW9ucy5wdXNoKHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMi4xIEJsb2NrXG5cbiAgICBmdW5jdGlvbiBwYXJzZVN0YXRlbWVudExpc3QoKSB7XG4gICAgICAgIHZhciBsaXN0ID0gW10sXG4gICAgICAgICAgICBzdGF0ZW1lbnQ7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRlbWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxpc3QucHVzaChzdGF0ZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VCbG9jaygpIHtcbiAgICAgICAgdmFyIGJsb2NrO1xuXG4gICAgICAgIGV4cGVjdCgneycpO1xuXG4gICAgICAgIGJsb2NrID0gcGFyc2VTdGF0ZW1lbnRMaXN0KCk7XG5cbiAgICAgICAgZXhwZWN0KCd9Jyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5CbG9ja1N0YXRlbWVudCxcbiAgICAgICAgICAgIGJvZHk6IGJsb2NrXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIuMiBWYXJpYWJsZSBTdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCkge1xuICAgICAgICB2YXIgdG9rZW4gPSBsZXgoKTtcblxuICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uSWRlbnRpZmllcikge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguSWRlbnRpZmllcixcbiAgICAgICAgICAgIG5hbWU6IHRva2VuLnZhbHVlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKGtpbmQpIHtcbiAgICAgICAgdmFyIGlkID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKSxcbiAgICAgICAgICAgIGluaXQgPSBudWxsO1xuXG4gICAgICAgIC8vIDEyLjIuMVxuICAgICAgICBpZiAoc3RyaWN0ICYmIGlzUmVzdHJpY3RlZFdvcmQoaWQubmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuU3RyaWN0VmFyTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoa2luZCA9PT0gJ2NvbnN0Jykge1xuICAgICAgICAgICAgZXhwZWN0KCc9Jyk7XG4gICAgICAgICAgICBpbml0ID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoKCc9JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgaW5pdCA9IHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguVmFyaWFibGVEZWNsYXJhdG9yLFxuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgaW5pdDogaW5pdFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbkxpc3Qoa2luZCkge1xuICAgICAgICB2YXIgbGlzdCA9IFtdO1xuXG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGxpc3QucHVzaChwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oa2luZCkpO1xuICAgICAgICAgICAgaWYgKCFtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgfSB3aGlsZSAoaW5kZXggPCBsZW5ndGgpO1xuXG4gICAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlVmFyaWFibGVTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciBkZWNsYXJhdGlvbnM7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgndmFyJyk7XG5cbiAgICAgICAgZGVjbGFyYXRpb25zID0gcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uTGlzdCgpO1xuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRpb24sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucyxcbiAgICAgICAgICAgIGtpbmQ6ICd2YXInXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8ga2luZCBtYXkgYmUgYGNvbnN0YCBvciBgbGV0YFxuICAgIC8vIEJvdGggYXJlIGV4cGVyaW1lbnRhbCBhbmQgbm90IGluIHRoZSBzcGVjaWZpY2F0aW9uIHlldC5cbiAgICAvLyBzZWUgaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTpjb25zdFxuICAgIC8vIGFuZCBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmxldFxuICAgIGZ1bmN0aW9uIHBhcnNlQ29uc3RMZXREZWNsYXJhdGlvbihraW5kKSB7XG4gICAgICAgIHZhciBkZWNsYXJhdGlvbnM7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZChraW5kKTtcblxuICAgICAgICBkZWNsYXJhdGlvbnMgPSBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25MaXN0KGtpbmQpO1xuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRpb24sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucyxcbiAgICAgICAgICAgIGtpbmQ6IGtpbmRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi4zIEVtcHR5IFN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VFbXB0eVN0YXRlbWVudCgpIHtcbiAgICAgICAgZXhwZWN0KCc7Jyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5FbXB0eVN0YXRlbWVudFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDEyLjQgRXhwcmVzc2lvbiBTdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5FeHByZXNzaW9uU3RhdGVtZW50LFxuICAgICAgICAgICAgZXhwcmVzc2lvbjogZXhwclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDEyLjUgSWYgc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZUlmU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgdGVzdCwgY29uc2VxdWVudCwgYWx0ZXJuYXRlO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2lmJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgdGVzdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIGNvbnNlcXVlbnQgPSBwYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ2Vsc2UnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICBhbHRlcm5hdGUgPSBwYXJzZVN0YXRlbWVudCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWx0ZXJuYXRlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguSWZTdGF0ZW1lbnQsXG4gICAgICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICAgICAgY29uc2VxdWVudDogY29uc2VxdWVudCxcbiAgICAgICAgICAgIGFsdGVybmF0ZTogYWx0ZXJuYXRlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIuNiBJdGVyYXRpb24gU3RhdGVtZW50c1xuXG4gICAgZnVuY3Rpb24gcGFyc2VEb1doaWxlU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgYm9keSwgdGVzdCwgb2xkSW5JdGVyYXRpb247XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnZG8nKTtcblxuICAgICAgICBvbGRJbkl0ZXJhdGlvbiA9IHN0YXRlLmluSXRlcmF0aW9uO1xuICAgICAgICBzdGF0ZS5pbkl0ZXJhdGlvbiA9IHRydWU7XG5cbiAgICAgICAgYm9keSA9IHBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICAgICAgc3RhdGUuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCd3aGlsZScpO1xuXG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIHRlc3QgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICBpZiAobWF0Y2goJzsnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkRvV2hpbGVTdGF0ZW1lbnQsXG4gICAgICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICAgICAgdGVzdDogdGVzdFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlV2hpbGVTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciB0ZXN0LCBib2R5LCBvbGRJbkl0ZXJhdGlvbjtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCd3aGlsZScpO1xuXG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIHRlc3QgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICBvbGRJbkl0ZXJhdGlvbiA9IHN0YXRlLmluSXRlcmF0aW9uO1xuICAgICAgICBzdGF0ZS5pbkl0ZXJhdGlvbiA9IHRydWU7XG5cbiAgICAgICAgYm9keSA9IHBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICAgICAgc3RhdGUuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LldoaWxlU3RhdGVtZW50LFxuICAgICAgICAgICAgdGVzdDogdGVzdCxcbiAgICAgICAgICAgIGJvZHk6IGJvZHlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUZvclZhcmlhYmxlRGVjbGFyYXRpb24oKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxleCgpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguVmFyaWFibGVEZWNsYXJhdGlvbixcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uczogcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uTGlzdCgpLFxuICAgICAgICAgICAga2luZDogdG9rZW4udmFsdWVcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUZvclN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGluaXQsIHRlc3QsIHVwZGF0ZSwgbGVmdCwgcmlnaHQsIGJvZHksIG9sZEluSXRlcmF0aW9uO1xuXG4gICAgICAgIGluaXQgPSB0ZXN0ID0gdXBkYXRlID0gbnVsbDtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCdmb3InKTtcblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICBpZiAobWF0Y2goJzsnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCd2YXInKSB8fCBtYXRjaEtleXdvcmQoJ2xldCcpKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuYWxsb3dJbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGluaXQgPSBwYXJzZUZvclZhcmlhYmxlRGVjbGFyYXRpb24oKTtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmIChpbml0LmRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDEgJiYgbWF0Y2hLZXl3b3JkKCdpbicpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gaW5pdDtcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSBwYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgICAgICAgICAgaW5pdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaW5pdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgICAgIHN0YXRlLmFsbG93SW4gPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoS2V5d29yZCgnaW4nKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBMZWZ0SGFuZFNpZGVFeHByZXNzaW9uXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNMZWZ0SGFuZFNpZGUoaW5pdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuSW52YWxpZExIU0luRm9ySW4pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQgPSBpbml0O1xuICAgICAgICAgICAgICAgICAgICByaWdodCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgICAgICAgICBpbml0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QoJzsnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgaWYgKCFtYXRjaCgnOycpKSB7XG4gICAgICAgICAgICAgICAgdGVzdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwZWN0KCc7Jyk7XG5cbiAgICAgICAgICAgIGlmICghbWF0Y2goJyknKSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZSA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgb2xkSW5JdGVyYXRpb24gPSBzdGF0ZS5pbkl0ZXJhdGlvbjtcbiAgICAgICAgc3RhdGUuaW5JdGVyYXRpb24gPSB0cnVlO1xuXG4gICAgICAgIGJvZHkgPSBwYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG5cbiAgICAgICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguRm9yU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGluaXQ6IGluaXQsXG4gICAgICAgICAgICAgICAgdGVzdDogdGVzdCxcbiAgICAgICAgICAgICAgICB1cGRhdGU6IHVwZGF0ZSxcbiAgICAgICAgICAgICAgICBib2R5OiBib2R5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Gb3JJblN0YXRlbWVudCxcbiAgICAgICAgICAgIGxlZnQ6IGxlZnQsXG4gICAgICAgICAgICByaWdodDogcmlnaHQsXG4gICAgICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICAgICAgZWFjaDogZmFsc2VcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi43IFRoZSBjb250aW51ZSBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlQ29udGludWVTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciB0b2tlbiwgbGFiZWwgPSBudWxsO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2NvbnRpbnVlJyk7XG5cbiAgICAgICAgLy8gT3B0aW1pemUgdGhlIG1vc3QgY29tbW9uIGZvcm06ICdjb250aW51ZTsnLlxuICAgICAgICBpZiAoc291cmNlW2luZGV4XSA9PT0gJzsnKSB7XG4gICAgICAgICAgICBsZXgoKTtcblxuICAgICAgICAgICAgaWYgKCFzdGF0ZS5pbkl0ZXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxDb250aW51ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkNvbnRpbnVlU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGxhYmVsOiBudWxsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBlZWtMaW5lVGVybWluYXRvcigpKSB7XG4gICAgICAgICAgICBpZiAoIXN0YXRlLmluSXRlcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuSWxsZWdhbENvbnRpbnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQ29udGludWVTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgbGFiZWw6IG51bGxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uSWRlbnRpZmllcikge1xuICAgICAgICAgICAgbGFiZWwgPSBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuXG4gICAgICAgICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzdGF0ZS5sYWJlbFNldCwgbGFiZWwubmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5Vbmtub3duTGFiZWwsIGxhYmVsLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIGlmIChsYWJlbCA9PT0gbnVsbCAmJiAhc3RhdGUuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxDb250aW51ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkNvbnRpbnVlU3RhdGVtZW50LFxuICAgICAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIuOCBUaGUgYnJlYWsgc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZUJyZWFrU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgdG9rZW4sIGxhYmVsID0gbnVsbDtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCdicmVhaycpO1xuXG4gICAgICAgIC8vIE9wdGltaXplIHRoZSBtb3N0IGNvbW1vbiBmb3JtOiAnYnJlYWs7Jy5cbiAgICAgICAgaWYgKHNvdXJjZVtpbmRleF0gPT09ICc7Jykge1xuICAgICAgICAgICAgbGV4KCk7XG5cbiAgICAgICAgICAgIGlmICghKHN0YXRlLmluSXRlcmF0aW9uIHx8IHN0YXRlLmluU3dpdGNoKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxCcmVhayk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJyZWFrU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGxhYmVsOiBudWxsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBlZWtMaW5lVGVybWluYXRvcigpKSB7XG4gICAgICAgICAgICBpZiAoIShzdGF0ZS5pbkl0ZXJhdGlvbiB8fCBzdGF0ZS5pblN3aXRjaCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbGxlZ2FsQnJlYWspO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5CcmVha1N0YXRlbWVudCxcbiAgICAgICAgICAgICAgICBsYWJlbDogbnVsbFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICBsYWJlbCA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG5cbiAgICAgICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXRlLmxhYmVsU2V0LCBsYWJlbC5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVua25vd25MYWJlbCwgbGFiZWwubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICAgICAgaWYgKGxhYmVsID09PSBudWxsICYmICEoc3RhdGUuaW5JdGVyYXRpb24gfHwgc3RhdGUuaW5Td2l0Y2gpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbGxlZ2FsQnJlYWspO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5CcmVha1N0YXRlbWVudCxcbiAgICAgICAgICAgIGxhYmVsOiBsYWJlbFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDEyLjkgVGhlIHJldHVybiBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlUmV0dXJuU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgdG9rZW4sIGFyZ3VtZW50ID0gbnVsbDtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCdyZXR1cm4nKTtcblxuICAgICAgICBpZiAoIXN0YXRlLmluRnVuY3Rpb25Cb2R5KSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLklsbGVnYWxSZXR1cm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gJ3JldHVybicgZm9sbG93ZWQgYnkgYSBzcGFjZSBhbmQgYW4gaWRlbnRpZmllciBpcyB2ZXJ5IGNvbW1vbi5cbiAgICAgICAgaWYgKHNvdXJjZVtpbmRleF0gPT09ICcgJykge1xuICAgICAgICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHNvdXJjZVtpbmRleCArIDFdKSkge1xuICAgICAgICAgICAgICAgIGFyZ3VtZW50ID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5SZXR1cm5TdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50OiBhcmd1bWVudFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGVla0xpbmVUZXJtaW5hdG9yKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlJldHVyblN0YXRlbWVudCxcbiAgICAgICAgICAgICAgICBhcmd1bWVudDogbnVsbFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbWF0Y2goJzsnKSkge1xuICAgICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2goJ30nKSAmJiB0b2tlbi50eXBlICE9PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICAgICAgICBhcmd1bWVudCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguUmV0dXJuU3RhdGVtZW50LFxuICAgICAgICAgICAgYXJndW1lbnQ6IGFyZ3VtZW50XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIuMTAgVGhlIHdpdGggc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZVdpdGhTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciBvYmplY3QsIGJvZHk7XG5cbiAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3RNb2RlV2l0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3RLZXl3b3JkKCd3aXRoJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgb2JqZWN0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgYm9keSA9IHBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5XaXRoU3RhdGVtZW50LFxuICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICBib2R5OiBib2R5XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIuMTAgVGhlIHN3aXRoIHN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VTd2l0Y2hDYXNlKCkge1xuICAgICAgICB2YXIgdGVzdCxcbiAgICAgICAgICAgIGNvbnNlcXVlbnQgPSBbXSxcbiAgICAgICAgICAgIHN0YXRlbWVudDtcblxuICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCdkZWZhdWx0JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgdGVzdCA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBlY3RLZXl3b3JkKCdjYXNlJyk7XG4gICAgICAgICAgICB0ZXN0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwZWN0KCc6Jyk7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJ30nKSB8fCBtYXRjaEtleXdvcmQoJ2RlZmF1bHQnKSB8fCBtYXRjaEtleXdvcmQoJ2Nhc2UnKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGVtZW50ID0gcGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc2VxdWVudC5wdXNoKHN0YXRlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LlN3aXRjaENhc2UsXG4gICAgICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICAgICAgY29uc2VxdWVudDogY29uc2VxdWVudFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlU3dpdGNoU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgZGlzY3JpbWluYW50LCBjYXNlcywgY2xhdXNlLCBvbGRJblN3aXRjaCwgZGVmYXVsdEZvdW5kO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ3N3aXRjaCcpO1xuXG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIGRpc2NyaW1pbmFudCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIGV4cGVjdCgneycpO1xuXG4gICAgICAgIGNhc2VzID0gW107XG5cbiAgICAgICAgaWYgKG1hdGNoKCd9JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguU3dpdGNoU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGRpc2NyaW1pbmFudDogZGlzY3JpbWluYW50LFxuICAgICAgICAgICAgICAgIGNhc2VzOiBjYXNlc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9sZEluU3dpdGNoID0gc3RhdGUuaW5Td2l0Y2g7XG4gICAgICAgIHN0YXRlLmluU3dpdGNoID0gdHJ1ZTtcbiAgICAgICAgZGVmYXVsdEZvdW5kID0gZmFsc2U7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xhdXNlID0gcGFyc2VTd2l0Y2hDYXNlKCk7XG4gICAgICAgICAgICBpZiAoY2xhdXNlLnRlc3QgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVmYXVsdEZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLk11bHRpcGxlRGVmYXVsdHNJblN3aXRjaCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlZmF1bHRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlcy5wdXNoKGNsYXVzZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZS5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuXG4gICAgICAgIGV4cGVjdCgnfScpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguU3dpdGNoU3RhdGVtZW50LFxuICAgICAgICAgICAgZGlzY3JpbWluYW50OiBkaXNjcmltaW5hbnQsXG4gICAgICAgICAgICBjYXNlczogY2FzZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi4xMyBUaGUgdGhyb3cgc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRocm93U3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgYXJndW1lbnQ7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgndGhyb3cnKTtcblxuICAgICAgICBpZiAocGVla0xpbmVUZXJtaW5hdG9yKCkpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLk5ld2xpbmVBZnRlclRocm93KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3VtZW50ID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguVGhyb3dTdGF0ZW1lbnQsXG4gICAgICAgICAgICBhcmd1bWVudDogYXJndW1lbnRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi4xNCBUaGUgdHJ5IHN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VDYXRjaENsYXVzZSgpIHtcbiAgICAgICAgdmFyIHBhcmFtO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2NhdGNoJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG4gICAgICAgIGlmIChtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQobG9va2FoZWFkKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyYW0gPSBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuICAgICAgICAvLyAxMi4xNC4xXG4gICAgICAgIGlmIChzdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChwYXJhbS5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3RDYXRjaFZhcmlhYmxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguQ2F0Y2hDbGF1c2UsXG4gICAgICAgICAgICBwYXJhbTogcGFyYW0sXG4gICAgICAgICAgICBib2R5OiBwYXJzZUJsb2NrKClcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRyeVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGJsb2NrLCBoYW5kbGVycyA9IFtdLCBmaW5hbGl6ZXIgPSBudWxsO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ3RyeScpO1xuXG4gICAgICAgIGJsb2NrID0gcGFyc2VCbG9jaygpO1xuXG4gICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ2NhdGNoJykpIHtcbiAgICAgICAgICAgIGhhbmRsZXJzLnB1c2gocGFyc2VDYXRjaENsYXVzZSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ2ZpbmFsbHknKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICBmaW5hbGl6ZXIgPSBwYXJzZUJsb2NrKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFuZGxlcnMubGVuZ3RoID09PSAwICYmICFmaW5hbGl6ZXIpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLk5vQ2F0Y2hPckZpbmFsbHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5UcnlTdGF0ZW1lbnQsXG4gICAgICAgICAgICBibG9jazogYmxvY2ssXG4gICAgICAgICAgICBndWFyZGVkSGFuZGxlcnM6IFtdLFxuICAgICAgICAgICAgaGFuZGxlcnM6IGhhbmRsZXJzLFxuICAgICAgICAgICAgZmluYWxpemVyOiBmaW5hbGl6ZXJcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi4xNSBUaGUgZGVidWdnZXIgc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZURlYnVnZ2VyU3RhdGVtZW50KCkge1xuICAgICAgICBleHBlY3RLZXl3b3JkKCdkZWJ1Z2dlcicpO1xuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkRlYnVnZ2VyU3RhdGVtZW50XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIgU3RhdGVtZW50c1xuXG4gICAgZnVuY3Rpb24gcGFyc2VTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxvb2thaGVhZCgpLFxuICAgICAgICAgICAgZXhwcixcbiAgICAgICAgICAgIGxhYmVsZWRCb2R5O1xuXG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uUHVuY3R1YXRvcikge1xuICAgICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnOyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRW1wdHlTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ3snOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUJsb2NrKCk7XG4gICAgICAgICAgICBjYXNlICcoJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLktleXdvcmQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2JyZWFrJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VCcmVha1N0YXRlbWVudCgpO1xuICAgICAgICAgICAgY2FzZSAnY29udGludWUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUNvbnRpbnVlU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBjYXNlICdkZWJ1Z2dlcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ2RvJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VEb1doaWxlU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBjYXNlICdmb3InOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZvclN0YXRlbWVudCgpO1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb24oKTtcbiAgICAgICAgICAgIGNhc2UgJ2lmJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJZlN0YXRlbWVudCgpO1xuICAgICAgICAgICAgY2FzZSAncmV0dXJuJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VSZXR1cm5TdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ3N3aXRjaCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlU3dpdGNoU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBjYXNlICd0aHJvdyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlVGhyb3dTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ3RyeSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlVHJ5U3RhdGVtZW50KCk7XG4gICAgICAgICAgICBjYXNlICd2YXInOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZVZhcmlhYmxlU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBjYXNlICd3aGlsZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlV2hpbGVTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ3dpdGgnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZVdpdGhTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgLy8gMTIuMTIgTGFiZWxsZWQgU3RhdGVtZW50c1xuICAgICAgICBpZiAoKGV4cHIudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIpICYmIG1hdGNoKCc6JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuXG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXRlLmxhYmVsU2V0LCBleHByLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuUmVkZWNsYXJhdGlvbiwgJ0xhYmVsJywgZXhwci5uYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhdGUubGFiZWxTZXRbZXhwci5uYW1lXSA9IHRydWU7XG4gICAgICAgICAgICBsYWJlbGVkQm9keSA9IHBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBkZWxldGUgc3RhdGUubGFiZWxTZXRbZXhwci5uYW1lXTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTGFiZWxlZFN0YXRlbWVudCxcbiAgICAgICAgICAgICAgICBsYWJlbDogZXhwcixcbiAgICAgICAgICAgICAgICBib2R5OiBsYWJlbGVkQm9keVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkV4cHJlc3Npb25TdGF0ZW1lbnQsXG4gICAgICAgICAgICBleHByZXNzaW9uOiBleHByXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTMgRnVuY3Rpb24gRGVmaW5pdGlvblxuXG4gICAgZnVuY3Rpb24gcGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzKCkge1xuICAgICAgICB2YXIgc291cmNlRWxlbWVudCwgc291cmNlRWxlbWVudHMgPSBbXSwgdG9rZW4sIGRpcmVjdGl2ZSwgZmlyc3RSZXN0cmljdGVkLFxuICAgICAgICAgICAgb2xkTGFiZWxTZXQsIG9sZEluSXRlcmF0aW9uLCBvbGRJblN3aXRjaCwgb2xkSW5GdW5jdGlvbkJvZHk7XG5cbiAgICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc291cmNlRWxlbWVudCA9IHBhcnNlU291cmNlRWxlbWVudCgpO1xuICAgICAgICAgICAgc291cmNlRWxlbWVudHMucHVzaChzb3VyY2VFbGVtZW50KTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VFbGVtZW50LmV4cHJlc3Npb24udHlwZSAhPT0gU3ludGF4LkxpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIG5vdCBkaXJlY3RpdmVcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpcmVjdGl2ZSA9IHNsaWNlU291cmNlKHRva2VuLnJhbmdlWzBdICsgMSwgdG9rZW4ucmFuZ2VbMV0gLSAxKTtcbiAgICAgICAgICAgIGlmIChkaXJlY3RpdmUgPT09ICd1c2Ugc3RyaWN0Jykge1xuICAgICAgICAgICAgICAgIHN0cmljdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoZmlyc3RSZXN0cmljdGVkLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdFJlc3RyaWN0ZWQgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgb2xkTGFiZWxTZXQgPSBzdGF0ZS5sYWJlbFNldDtcbiAgICAgICAgb2xkSW5JdGVyYXRpb24gPSBzdGF0ZS5pbkl0ZXJhdGlvbjtcbiAgICAgICAgb2xkSW5Td2l0Y2ggPSBzdGF0ZS5pblN3aXRjaDtcbiAgICAgICAgb2xkSW5GdW5jdGlvbkJvZHkgPSBzdGF0ZS5pbkZ1bmN0aW9uQm9keTtcblxuICAgICAgICBzdGF0ZS5sYWJlbFNldCA9IHt9O1xuICAgICAgICBzdGF0ZS5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgICAgICBzdGF0ZS5pblN3aXRjaCA9IGZhbHNlO1xuICAgICAgICBzdGF0ZS5pbkZ1bmN0aW9uQm9keSA9IHRydWU7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlRWxlbWVudCA9IHBhcnNlU291cmNlRWxlbWVudCgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VFbGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlRWxlbWVudHMucHVzaChzb3VyY2VFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cGVjdCgnfScpO1xuXG4gICAgICAgIHN0YXRlLmxhYmVsU2V0ID0gb2xkTGFiZWxTZXQ7XG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgICAgIHN0YXRlLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICAgIHN0YXRlLmluRnVuY3Rpb25Cb2R5ID0gb2xkSW5GdW5jdGlvbkJvZHk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5CbG9ja1N0YXRlbWVudCxcbiAgICAgICAgICAgIGJvZHk6IHNvdXJjZUVsZW1lbnRzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VGdW5jdGlvbkRlY2xhcmF0aW9uKCkge1xuICAgICAgICB2YXIgaWQsIHBhcmFtLCBwYXJhbXMgPSBbXSwgYm9keSwgdG9rZW4sIHN0cmljdGVkLCBmaXJzdFJlc3RyaWN0ZWQsIG1lc3NhZ2UsIHByZXZpb3VzU3RyaWN0LCBwYXJhbVNldDtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCdmdW5jdGlvbicpO1xuICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICBpZCA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuU3RyaWN0RnVuY3Rpb25OYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RGdW5jdGlvbk5hbWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0UmVzZXJ2ZWRXb3JkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgaWYgKCFtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICBwYXJhbVNldCA9IHt9O1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgICAgICAgICBwYXJhbSA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0UGFyYW1OYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocGFyYW1TZXQsIHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbUR1cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFmaXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0UmVzZXJ2ZWRXb3JkO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbVNldCwgdG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbUR1cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICAgICAgICAgIHBhcmFtU2V0W3BhcmFtLm5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2goJyknKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhwZWN0KCcsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICBwcmV2aW91c1N0cmljdCA9IHN0cmljdDtcbiAgICAgICAgYm9keSA9IHBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cygpO1xuICAgICAgICBpZiAoc3RyaWN0ICYmIGZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihmaXJzdFJlc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHJpY3QgJiYgc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudChzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5GdW5jdGlvbkRlY2xhcmF0aW9uLFxuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICBkZWZhdWx0czogW10sXG4gICAgICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICAgICAgcmVzdDogbnVsbCxcbiAgICAgICAgICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgICAgICAgICBleHByZXNzaW9uOiBmYWxzZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRnVuY3Rpb25FeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgdG9rZW4sIGlkID0gbnVsbCwgc3RyaWN0ZWQsIGZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSwgcGFyYW0sIHBhcmFtcyA9IFtdLCBib2R5LCBwcmV2aW91c1N0cmljdCwgcGFyYW1TZXQ7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnZnVuY3Rpb24nKTtcblxuICAgICAgICBpZiAoIW1hdGNoKCcoJykpIHtcbiAgICAgICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgICAgICBpZCA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuU3RyaWN0RnVuY3Rpb25OYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdEZ1bmN0aW9uTmFtZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RSZXNlcnZlZFdvcmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgaWYgKCFtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICBwYXJhbVNldCA9IHt9O1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgICAgICAgICBwYXJhbSA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0UGFyYW1OYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocGFyYW1TZXQsIHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbUR1cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFmaXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0UmVzZXJ2ZWRXb3JkO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbVNldCwgdG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbUR1cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICAgICAgICAgIHBhcmFtU2V0W3BhcmFtLm5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2goJyknKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhwZWN0KCcsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICBwcmV2aW91c1N0cmljdCA9IHN0cmljdDtcbiAgICAgICAgYm9keSA9IHBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cygpO1xuICAgICAgICBpZiAoc3RyaWN0ICYmIGZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihmaXJzdFJlc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHJpY3QgJiYgc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudChzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5GdW5jdGlvbkV4cHJlc3Npb24sXG4gICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgIGRlZmF1bHRzOiBbXSxcbiAgICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgICByZXN0OiBudWxsLFxuICAgICAgICAgICAgZ2VuZXJhdG9yOiBmYWxzZSxcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGZhbHNlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTQgUHJvZ3JhbVxuXG4gICAgZnVuY3Rpb24gcGFyc2VTb3VyY2VFbGVtZW50KCkge1xuICAgICAgICB2YXIgdG9rZW4gPSBsb29rYWhlYWQoKTtcblxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnY29uc3QnOlxuICAgICAgICAgICAgY2FzZSAnbGV0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VDb25zdExldERlY2xhcmF0aW9uKHRva2VuLnZhbHVlKTtcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGdW5jdGlvbkRlY2xhcmF0aW9uKCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZVN0YXRlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVNvdXJjZUVsZW1lbnRzKCkge1xuICAgICAgICB2YXIgc291cmNlRWxlbWVudCwgc291cmNlRWxlbWVudHMgPSBbXSwgdG9rZW4sIGRpcmVjdGl2ZSwgZmlyc3RSZXN0cmljdGVkO1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5TdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNvdXJjZUVsZW1lbnQgPSBwYXJzZVNvdXJjZUVsZW1lbnQoKTtcbiAgICAgICAgICAgIHNvdXJjZUVsZW1lbnRzLnB1c2goc291cmNlRWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoc291cmNlRWxlbWVudC5leHByZXNzaW9uLnR5cGUgIT09IFN5bnRheC5MaXRlcmFsKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBub3QgZGlyZWN0aXZlXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXJlY3RpdmUgPSBzbGljZVNvdXJjZSh0b2tlbi5yYW5nZVswXSArIDEsIHRva2VuLnJhbmdlWzFdIC0gMSk7XG4gICAgICAgICAgICBpZiAoZGlyZWN0aXZlID09PSAndXNlIHN0cmljdCcpIHtcbiAgICAgICAgICAgICAgICBzdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KGZpcnN0UmVzdHJpY3RlZCwgTWVzc2FnZXMuU3RyaWN0T2N0YWxMaXRlcmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghZmlyc3RSZXN0cmljdGVkICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgc291cmNlRWxlbWVudCA9IHBhcnNlU291cmNlRWxlbWVudCgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VFbGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlRWxlbWVudHMucHVzaChzb3VyY2VFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc291cmNlRWxlbWVudHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VQcm9ncmFtKCkge1xuICAgICAgICB2YXIgcHJvZ3JhbTtcbiAgICAgICAgc3RyaWN0ID0gZmFsc2U7XG4gICAgICAgIHByb2dyYW0gPSB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguUHJvZ3JhbSxcbiAgICAgICAgICAgIGJvZHk6IHBhcnNlU291cmNlRWxlbWVudHMoKVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcHJvZ3JhbTtcbiAgICB9XG5cbiAgICAvLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBhcmUgbmVlZGVkIG9ubHkgd2hlbiB0aGUgb3B0aW9uIHRvIHByZXNlcnZlXG4gICAgLy8gdGhlIGNvbW1lbnRzIGlzIGFjdGl2ZS5cblxuICAgIGZ1bmN0aW9uIGFkZENvbW1lbnQodHlwZSwgdmFsdWUsIHN0YXJ0LCBlbmQsIGxvYykge1xuICAgICAgICBhc3NlcnQodHlwZW9mIHN0YXJ0ID09PSAnbnVtYmVyJywgJ0NvbW1lbnQgbXVzdCBoYXZlIHZhbGlkIHBvc2l0aW9uJyk7XG5cbiAgICAgICAgLy8gQmVjYXVzZSB0aGUgd2F5IHRoZSBhY3R1YWwgdG9rZW4gaXMgc2Nhbm5lZCwgb2Z0ZW4gdGhlIGNvbW1lbnRzXG4gICAgICAgIC8vIChpZiBhbnkpIGFyZSBza2lwcGVkIHR3aWNlIGR1cmluZyB0aGUgbGV4aWNhbCBhbmFseXNpcy5cbiAgICAgICAgLy8gVGh1cywgd2UgbmVlZCB0byBza2lwIGFkZGluZyBhIGNvbW1lbnQgaWYgdGhlIGNvbW1lbnQgYXJyYXkgYWxyZWFkeVxuICAgICAgICAvLyBoYW5kbGVkIGl0LlxuICAgICAgICBpZiAoZXh0cmEuY29tbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKGV4dHJhLmNvbW1lbnRzW2V4dHJhLmNvbW1lbnRzLmxlbmd0aCAtIDFdLnJhbmdlWzFdID4gc3RhcnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHRyYS5jb21tZW50cy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBlbmRdLFxuICAgICAgICAgICAgbG9jOiBsb2NcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbkNvbW1lbnQoKSB7XG4gICAgICAgIHZhciBjb21tZW50LCBjaCwgbG9jLCBzdGFydCwgYmxvY2tDb21tZW50LCBsaW5lQ29tbWVudDtcblxuICAgICAgICBjb21tZW50ID0gJyc7XG4gICAgICAgIGJsb2NrQ29tbWVudCA9IGZhbHNlO1xuICAgICAgICBsaW5lQ29tbWVudCA9IGZhbHNlO1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuXG4gICAgICAgICAgICBpZiAobGluZUNvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jLmVuZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0IC0gMVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBsaW5lQ29tbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBhZGRDb21tZW50KCdMaW5lJywgY29tbWVudCwgc3RhcnQsIGluZGV4IC0gMSwgbG9jKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAnXFxyJyAmJiBzb3VyY2VbaW5kZXhdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICArK2xpbmVOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZUNvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudCArPSBjaDtcbiAgICAgICAgICAgICAgICAgICAgbG9jLmVuZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IGxlbmd0aCAtIGxpbmVTdGFydFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBhZGRDb21tZW50KCdMaW5lJywgY29tbWVudCwgc3RhcnQsIGxlbmd0aCwgbG9jKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ICs9IGNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYmxvY2tDb21tZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ1xccicgJiYgc291cmNlW2luZGV4ICsgMV0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCArPSAnXFxyXFxuJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgKz0gY2g7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb21tZW50ICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICcqJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gY29tbWVudC5zdWJzdHIoMCwgY29tbWVudC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja0NvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYy5lbmQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZENvbW1lbnQoJ0Jsb2NrJywgY29tbWVudCwgc3RhcnQsIGluZGV4LCBsb2MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4ICsgMV07XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgbGluZUNvbW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2MuZW5kID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVDb21tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRDb21tZW50KCdMaW5lJywgY29tbWVudCwgc3RhcnQsIGluZGV4LCBsb2MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDI7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrQ29tbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGxvYyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0IC0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzV2hpdGVTcGFjZShjaCkpIHtcbiAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAgJ1xccicgJiYgc291cmNlW2luZGV4XSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckNvbW1lbnRMb2NhdGlvbigpIHtcbiAgICAgICAgdmFyIGksIGVudHJ5LCBjb21tZW50LCBjb21tZW50cyA9IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBleHRyYS5jb21tZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgZW50cnkgPSBleHRyYS5jb21tZW50c1tpXTtcbiAgICAgICAgICAgIGNvbW1lbnQgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogZW50cnkudHlwZSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogZW50cnkudmFsdWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoZXh0cmEucmFuZ2UpIHtcbiAgICAgICAgICAgICAgICBjb21tZW50LnJhbmdlID0gZW50cnkucmFuZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXh0cmEubG9jKSB7XG4gICAgICAgICAgICAgICAgY29tbWVudC5sb2MgPSBlbnRyeS5sb2M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb21tZW50cy5wdXNoKGNvbW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXh0cmEuY29tbWVudHMgPSBjb21tZW50cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb2xsZWN0VG9rZW4oKSB7XG4gICAgICAgIHZhciBzdGFydCwgbG9jLCB0b2tlbiwgcmFuZ2UsIHZhbHVlO1xuXG4gICAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICAgIHN0YXJ0ID0gaW5kZXg7XG4gICAgICAgIGxvYyA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdG9rZW4gPSBleHRyYS5hZHZhbmNlKCk7XG4gICAgICAgIGxvYy5lbmQgPSB7XG4gICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICAgIHJhbmdlID0gW3Rva2VuLnJhbmdlWzBdLCB0b2tlbi5yYW5nZVsxXV07XG4gICAgICAgICAgICB2YWx1ZSA9IHNsaWNlU291cmNlKHRva2VuLnJhbmdlWzBdLCB0b2tlbi5yYW5nZVsxXSk7XG4gICAgICAgICAgICBleHRyYS50b2tlbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5OYW1lW3Rva2VuLnR5cGVdLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2UsXG4gICAgICAgICAgICAgICAgbG9jOiBsb2NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbGxlY3RSZWdleCgpIHtcbiAgICAgICAgdmFyIHBvcywgbG9jLCByZWdleCwgdG9rZW47XG5cbiAgICAgICAgc2tpcENvbW1lbnQoKTtcblxuICAgICAgICBwb3MgPSBpbmRleDtcbiAgICAgICAgbG9jID0ge1xuICAgICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZWdleCA9IGV4dHJhLnNjYW5SZWdFeHAoKTtcbiAgICAgICAgbG9jLmVuZCA9IHtcbiAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUG9wIHRoZSBwcmV2aW91cyB0b2tlbiwgd2hpY2ggaXMgbGlrZWx5ICcvJyBvciAnLz0nXG4gICAgICAgIGlmIChleHRyYS50b2tlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEudG9rZW5zLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKHRva2VuLnJhbmdlWzBdID09PSBwb3MgJiYgdG9rZW4udHlwZSA9PT0gJ1B1bmN0dWF0b3InKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRva2VuLnZhbHVlID09PSAnLycgfHwgdG9rZW4udmFsdWUgPT09ICcvPScpIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0cmEudG9rZW5zLnBvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dHJhLnRva2Vucy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6ICdSZWd1bGFyRXhwcmVzc2lvbicsXG4gICAgICAgICAgICB2YWx1ZTogcmVnZXgubGl0ZXJhbCxcbiAgICAgICAgICAgIHJhbmdlOiBbcG9zLCBpbmRleF0sXG4gICAgICAgICAgICBsb2M6IGxvY1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVnZXg7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVyVG9rZW5Mb2NhdGlvbigpIHtcbiAgICAgICAgdmFyIGksIGVudHJ5LCB0b2tlbiwgdG9rZW5zID0gW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGV4dHJhLnRva2Vucy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgZW50cnkgPSBleHRyYS50b2tlbnNbaV07XG4gICAgICAgICAgICB0b2tlbiA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBlbnRyeS50eXBlLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBlbnRyeS52YWx1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgICAgICAgIHRva2VuLnJhbmdlID0gZW50cnkucmFuZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXh0cmEubG9jKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4ubG9jID0gZW50cnkubG9jO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgZXh0cmEudG9rZW5zID0gdG9rZW5zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUxpdGVyYWwodG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5MaXRlcmFsLFxuICAgICAgICAgICAgdmFsdWU6IHRva2VuLnZhbHVlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlUmF3TGl0ZXJhbCh0b2tlbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkxpdGVyYWwsXG4gICAgICAgICAgICB2YWx1ZTogdG9rZW4udmFsdWUsXG4gICAgICAgICAgICByYXc6IHNsaWNlU291cmNlKHRva2VuLnJhbmdlWzBdLCB0b2tlbi5yYW5nZVsxXSlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVMb2NhdGlvbk1hcmtlcigpIHtcbiAgICAgICAgdmFyIG1hcmtlciA9IHt9O1xuXG4gICAgICAgIG1hcmtlci5yYW5nZSA9IFtpbmRleCwgaW5kZXhdO1xuICAgICAgICBtYXJrZXIubG9jID0ge1xuICAgICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmQ6IHtcbiAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBtYXJrZXIuZW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5yYW5nZVsxXSA9IGluZGV4O1xuICAgICAgICAgICAgdGhpcy5sb2MuZW5kLmxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgICAgICAgdGhpcy5sb2MuZW5kLmNvbHVtbiA9IGluZGV4IC0gbGluZVN0YXJ0O1xuICAgICAgICB9O1xuXG4gICAgICAgIG1hcmtlci5hcHBseUdyb3VwID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgICAgICAgIG5vZGUuZ3JvdXBSYW5nZSA9IFt0aGlzLnJhbmdlWzBdLCB0aGlzLnJhbmdlWzFdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHRyYS5sb2MpIHtcbiAgICAgICAgICAgICAgICBub2RlLmdyb3VwTG9jID0ge1xuICAgICAgICAgICAgICAgICAgICBzdGFydDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogdGhpcy5sb2Muc3RhcnQubGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogdGhpcy5sb2Muc3RhcnQuY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVuZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogdGhpcy5sb2MuZW5kLmxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IHRoaXMubG9jLmVuZC5jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgbWFya2VyLmFwcGx5ID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgICAgICAgIG5vZGUucmFuZ2UgPSBbdGhpcy5yYW5nZVswXSwgdGhpcy5yYW5nZVsxXV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXh0cmEubG9jKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5sb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLmxvYy5zdGFydC5saW5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uOiB0aGlzLmxvYy5zdGFydC5jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZW5kOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLmxvYy5lbmQubGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogdGhpcy5sb2MuZW5kLmNvbHVtblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbWFya2VyO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyYWNrR3JvdXBFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgbWFya2VyLCBleHByO1xuXG4gICAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICAgIG1hcmtlciA9IGNyZWF0ZUxvY2F0aW9uTWFya2VyKCk7XG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICBtYXJrZXIuZW5kKCk7XG4gICAgICAgIG1hcmtlci5hcHBseUdyb3VwKGV4cHIpO1xuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyYWNrTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgZXhwcjtcblxuICAgICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgICBtYXJrZXIgPSBjcmVhdGVMb2NhdGlvbk1hcmtlcigpO1xuXG4gICAgICAgIGV4cHIgPSBtYXRjaEtleXdvcmQoJ25ldycpID8gcGFyc2VOZXdFeHByZXNzaW9uKCkgOiBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoKCcuJykgfHwgbWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgaWYgKG1hdGNoKCdbJykpIHtcbiAgICAgICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTWVtYmVyRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHBhcnNlQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbWFya2VyLmVuZCgpO1xuICAgICAgICAgICAgICAgIG1hcmtlci5hcHBseShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4Lk1lbWJlckV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBleHByLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcGFyc2VOb25Db21wdXRlZE1lbWJlcigpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtYXJrZXIuZW5kKCk7XG4gICAgICAgICAgICAgICAgbWFya2VyLmFwcGx5KGV4cHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhY2tMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsKCkge1xuICAgICAgICB2YXIgbWFya2VyLCBleHByO1xuXG4gICAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICAgIG1hcmtlciA9IGNyZWF0ZUxvY2F0aW9uTWFya2VyKCk7XG5cbiAgICAgICAgZXhwciA9IG1hdGNoS2V5d29yZCgnbmV3JykgPyBwYXJzZU5ld0V4cHJlc3Npb24oKSA6IHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJy4nKSB8fCBtYXRjaCgnWycpIHx8IG1hdGNoKCcoJykpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnKCcpKSB7XG4gICAgICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkNhbGxFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICBjYWxsZWU6IGV4cHIsXG4gICAgICAgICAgICAgICAgICAgICdhcmd1bWVudHMnOiBwYXJzZUFyZ3VtZW50cygpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtYXJrZXIuZW5kKCk7XG4gICAgICAgICAgICAgICAgbWFya2VyLmFwcGx5KGV4cHIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCgnWycpKSB7XG4gICAgICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4Lk1lbWJlckV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IGV4cHIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiBwYXJzZUNvbXB1dGVkTWVtYmVyKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG1hcmtlci5lbmQoKTtcbiAgICAgICAgICAgICAgICBtYXJrZXIuYXBwbHkoZXhwcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbWFya2VyLmVuZCgpO1xuICAgICAgICAgICAgICAgIG1hcmtlci5hcHBseShleHByKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckdyb3VwKG5vZGUpIHtcbiAgICAgICAgdmFyIG4sIGksIGVudHJ5O1xuXG4gICAgICAgIG4gPSAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5hcHBseShub2RlKSA9PT0gJ1tvYmplY3QgQXJyYXldJykgPyBbXSA6IHt9O1xuICAgICAgICBmb3IgKGkgaW4gbm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUuaGFzT3duUHJvcGVydHkoaSkgJiYgaSAhPT0gJ2dyb3VwUmFuZ2UnICYmIGkgIT09ICdncm91cExvYycpIHtcbiAgICAgICAgICAgICAgICBlbnRyeSA9IG5vZGVbaV07XG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5ID09PSBudWxsIHx8IHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcgfHwgZW50cnkgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgbltpXSA9IGVudHJ5O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5baV0gPSBmaWx0ZXJHcm91cChlbnRyeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdyYXBUcmFja2luZ0Z1bmN0aW9uKHJhbmdlLCBsb2MpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHBhcnNlRnVuY3Rpb24pIHtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNCaW5hcnkobm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLnR5cGUgPT09IFN5bnRheC5Mb2dpY2FsRXhwcmVzc2lvbiB8fFxuICAgICAgICAgICAgICAgICAgICBub2RlLnR5cGUgPT09IFN5bnRheC5CaW5hcnlFeHByZXNzaW9uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB2aXNpdChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0LCBlbmQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNCaW5hcnkobm9kZS5sZWZ0KSkge1xuICAgICAgICAgICAgICAgICAgICB2aXNpdChub2RlLmxlZnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaXNCaW5hcnkobm9kZS5yaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmlzaXQobm9kZS5yaWdodCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmxlZnQuZ3JvdXBSYW5nZSB8fCBub2RlLnJpZ2h0Lmdyb3VwUmFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0ID0gbm9kZS5sZWZ0Lmdyb3VwUmFuZ2UgPyBub2RlLmxlZnQuZ3JvdXBSYW5nZVswXSA6IG5vZGUubGVmdC5yYW5nZVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IG5vZGUucmlnaHQuZ3JvdXBSYW5nZSA/IG5vZGUucmlnaHQuZ3JvdXBSYW5nZVsxXSA6IG5vZGUucmlnaHQucmFuZ2VbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJhbmdlID0gW3N0YXJ0LCBlbmRdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBub2RlLnJhbmdlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSBub2RlLmxlZnQucmFuZ2VbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQgPSBub2RlLnJpZ2h0LnJhbmdlWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yYW5nZSA9IFtzdGFydCwgZW5kXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobG9jKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmxlZnQuZ3JvdXBMb2MgfHwgbm9kZS5yaWdodC5ncm91cExvYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSBub2RlLmxlZnQuZ3JvdXBMb2MgPyBub2RlLmxlZnQuZ3JvdXBMb2Muc3RhcnQgOiBub2RlLmxlZnQubG9jLnN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kID0gbm9kZS5yaWdodC5ncm91cExvYyA/IG5vZGUucmlnaHQuZ3JvdXBMb2MuZW5kIDogbm9kZS5yaWdodC5sb2MuZW5kO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5sb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogZW5kXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBub2RlLmxvYyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUubG9jID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBub2RlLmxlZnQubG9jLnN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogbm9kZS5yaWdodC5sb2MuZW5kXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBtYXJrZXIsIG5vZGU7XG5cbiAgICAgICAgICAgICAgICBza2lwQ29tbWVudCgpO1xuXG4gICAgICAgICAgICAgICAgbWFya2VyID0gY3JlYXRlTG9jYXRpb25NYXJrZXIoKTtcbiAgICAgICAgICAgICAgICBub2RlID0gcGFyc2VGdW5jdGlvbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIG1hcmtlci5lbmQoKTtcblxuICAgICAgICAgICAgICAgIGlmIChyYW5nZSAmJiB0eXBlb2Ygbm9kZS5yYW5nZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyLmFwcGx5KG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChsb2MgJiYgdHlwZW9mIG5vZGUubG9jID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIuYXBwbHkobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGlzQmluYXJ5KG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZpc2l0KG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXRjaCgpIHtcblxuICAgICAgICB2YXIgd3JhcFRyYWNraW5nO1xuXG4gICAgICAgIGlmIChleHRyYS5jb21tZW50cykge1xuICAgICAgICAgICAgZXh0cmEuc2tpcENvbW1lbnQgPSBza2lwQ29tbWVudDtcbiAgICAgICAgICAgIHNraXBDb21tZW50ID0gc2NhbkNvbW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXh0cmEucmF3KSB7XG4gICAgICAgICAgICBleHRyYS5jcmVhdGVMaXRlcmFsID0gY3JlYXRlTGl0ZXJhbDtcbiAgICAgICAgICAgIGNyZWF0ZUxpdGVyYWwgPSBjcmVhdGVSYXdMaXRlcmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4dHJhLnJhbmdlIHx8IGV4dHJhLmxvYykge1xuXG4gICAgICAgICAgICBleHRyYS5wYXJzZUdyb3VwRXhwcmVzc2lvbiA9IHBhcnNlR3JvdXBFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uID0gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsID0gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsO1xuICAgICAgICAgICAgcGFyc2VHcm91cEV4cHJlc3Npb24gPSB0cmFja0dyb3VwRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbiA9IHRyYWNrTGVmdEhhbmRTaWRlRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCA9IHRyYWNrTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbDtcblxuICAgICAgICAgICAgd3JhcFRyYWNraW5nID0gd3JhcFRyYWNraW5nRnVuY3Rpb24oZXh0cmEucmFuZ2UsIGV4dHJhLmxvYyk7XG5cbiAgICAgICAgICAgIGV4dHJhLnBhcnNlQWRkaXRpdmVFeHByZXNzaW9uID0gcGFyc2VBZGRpdGl2ZUV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlQml0d2lzZUFOREV4cHJlc3Npb24gPSBwYXJzZUJpdHdpc2VBTkRFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VCaXR3aXNlT1JFeHByZXNzaW9uID0gcGFyc2VCaXR3aXNlT1JFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VCaXR3aXNlWE9SRXhwcmVzc2lvbiA9IHBhcnNlQml0d2lzZVhPUkV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUJsb2NrID0gcGFyc2VCbG9jaztcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cyA9IHBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cztcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlQ2F0Y2hDbGF1c2UgPSBwYXJzZUNhdGNoQ2xhdXNlO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VDb21wdXRlZE1lbWJlciA9IHBhcnNlQ29tcHV0ZWRNZW1iZXI7XG4gICAgICAgICAgICBleHRyYS5wYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbiA9IHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VDb25zdExldERlY2xhcmF0aW9uID0gcGFyc2VDb25zdExldERlY2xhcmF0aW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VFcXVhbGl0eUV4cHJlc3Npb24gPSBwYXJzZUVxdWFsaXR5RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlRXhwcmVzc2lvbiA9IHBhcnNlRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlRm9yVmFyaWFibGVEZWNsYXJhdGlvbiA9IHBhcnNlRm9yVmFyaWFibGVEZWNsYXJhdGlvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlRnVuY3Rpb25EZWNsYXJhdGlvbiA9IHBhcnNlRnVuY3Rpb25EZWNsYXJhdGlvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlRnVuY3Rpb25FeHByZXNzaW9uID0gcGFyc2VGdW5jdGlvbkV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUxvZ2ljYWxBTkRFeHByZXNzaW9uID0gcGFyc2VMb2dpY2FsQU5ERXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlTG9naWNhbE9SRXhwcmVzc2lvbiA9IHBhcnNlTG9naWNhbE9SRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlTXVsdGlwbGljYXRpdmVFeHByZXNzaW9uID0gcGFyc2VNdWx0aXBsaWNhdGl2ZUV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZU5ld0V4cHJlc3Npb24gPSBwYXJzZU5ld0V4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZU5vbkNvbXB1dGVkUHJvcGVydHkgPSBwYXJzZU5vbkNvbXB1dGVkUHJvcGVydHk7XG4gICAgICAgICAgICBleHRyYS5wYXJzZU9iamVjdFByb3BlcnR5ID0gcGFyc2VPYmplY3RQcm9wZXJ0eTtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlT2JqZWN0UHJvcGVydHlLZXkgPSBwYXJzZU9iamVjdFByb3BlcnR5S2V5O1xuICAgICAgICAgICAgZXh0cmEucGFyc2VQb3N0Zml4RXhwcmVzc2lvbiA9IHBhcnNlUG9zdGZpeEV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZVByaW1hcnlFeHByZXNzaW9uID0gcGFyc2VQcmltYXJ5RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlUHJvZ3JhbSA9IHBhcnNlUHJvZ3JhbTtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlUHJvcGVydHlGdW5jdGlvbiA9IHBhcnNlUHJvcGVydHlGdW5jdGlvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlUmVsYXRpb25hbEV4cHJlc3Npb24gPSBwYXJzZVJlbGF0aW9uYWxFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VTdGF0ZW1lbnQgPSBwYXJzZVN0YXRlbWVudDtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlU2hpZnRFeHByZXNzaW9uID0gcGFyc2VTaGlmdEV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZVN3aXRjaENhc2UgPSBwYXJzZVN3aXRjaENhc2U7XG4gICAgICAgICAgICBleHRyYS5wYXJzZVVuYXJ5RXhwcmVzc2lvbiA9IHBhcnNlVW5hcnlFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uID0gcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIgPSBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcjtcblxuICAgICAgICAgICAgcGFyc2VBZGRpdGl2ZUV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VBZGRpdGl2ZUV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlQml0d2lzZUFOREV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VCaXR3aXNlQU5ERXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZUJpdHdpc2VPUkV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VCaXR3aXNlT1JFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlQml0d2lzZVhPUkV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VCaXR3aXNlWE9SRXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZUJsb2NrID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlQmxvY2spO1xuICAgICAgICAgICAgcGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cyk7XG4gICAgICAgICAgICBwYXJzZUNhdGNoQ2xhdXNlID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlQ2F0Y2hDbGF1c2UpO1xuICAgICAgICAgICAgcGFyc2VDb21wdXRlZE1lbWJlciA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUNvbXB1dGVkTWVtYmVyKTtcbiAgICAgICAgICAgIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlQ29uc3RMZXREZWNsYXJhdGlvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUNvbnN0TGV0RGVjbGFyYXRpb24pO1xuICAgICAgICAgICAgcGFyc2VFcXVhbGl0eUV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VFcXVhbGl0eUV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlRXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZUZvclZhcmlhYmxlRGVjbGFyYXRpb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VGb3JWYXJpYWJsZURlY2xhcmF0aW9uKTtcbiAgICAgICAgICAgIHBhcnNlRnVuY3Rpb25EZWNsYXJhdGlvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb24pO1xuICAgICAgICAgICAgcGFyc2VGdW5jdGlvbkV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VGdW5jdGlvbkV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZUxvZ2ljYWxBTkRFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlTG9naWNhbEFOREV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VMb2dpY2FsT1JFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlTG9naWNhbE9SRXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZU11bHRpcGxpY2F0aXZlRXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZU11bHRpcGxpY2F0aXZlRXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZU5ld0V4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VOZXdFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZU5vbkNvbXB1dGVkUHJvcGVydHkpO1xuICAgICAgICAgICAgcGFyc2VPYmplY3RQcm9wZXJ0eSA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZU9iamVjdFByb3BlcnR5KTtcbiAgICAgICAgICAgIHBhcnNlT2JqZWN0UHJvcGVydHlLZXkgPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VPYmplY3RQcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICBwYXJzZVBvc3RmaXhFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlUG9zdGZpeEV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VQcmltYXJ5RXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZVByaW1hcnlFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlUHJvZ3JhbSA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZVByb2dyYW0pO1xuICAgICAgICAgICAgcGFyc2VQcm9wZXJ0eUZ1bmN0aW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlUHJvcGVydHlGdW5jdGlvbik7XG4gICAgICAgICAgICBwYXJzZVJlbGF0aW9uYWxFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlUmVsYXRpb25hbEV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VTdGF0ZW1lbnQgPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VTdGF0ZW1lbnQpO1xuICAgICAgICAgICAgcGFyc2VTaGlmdEV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VTaGlmdEV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VTd2l0Y2hDYXNlID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlU3dpdGNoQ2FzZSk7XG4gICAgICAgICAgICBwYXJzZVVuYXJ5RXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZVVuYXJ5RXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKTtcbiAgICAgICAgICAgIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgZXh0cmEudG9rZW5zICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZXh0cmEuYWR2YW5jZSA9IGFkdmFuY2U7XG4gICAgICAgICAgICBleHRyYS5zY2FuUmVnRXhwID0gc2NhblJlZ0V4cDtcblxuICAgICAgICAgICAgYWR2YW5jZSA9IGNvbGxlY3RUb2tlbjtcbiAgICAgICAgICAgIHNjYW5SZWdFeHAgPSBjb2xsZWN0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bnBhdGNoKCkge1xuICAgICAgICBpZiAodHlwZW9mIGV4dHJhLnNraXBDb21tZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBza2lwQ29tbWVudCA9IGV4dHJhLnNraXBDb21tZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4dHJhLnJhdykge1xuICAgICAgICAgICAgY3JlYXRlTGl0ZXJhbCA9IGV4dHJhLmNyZWF0ZUxpdGVyYWw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXh0cmEucmFuZ2UgfHwgZXh0cmEubG9jKSB7XG4gICAgICAgICAgICBwYXJzZUFkZGl0aXZlRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlQWRkaXRpdmVFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZUJpdHdpc2VBTkRFeHByZXNzaW9uID0gZXh0cmEucGFyc2VCaXR3aXNlQU5ERXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlQml0d2lzZU9SRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlQml0d2lzZU9SRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlQml0d2lzZVhPUkV4cHJlc3Npb24gPSBleHRyYS5wYXJzZUJpdHdpc2VYT1JFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VCbG9jayA9IGV4dHJhLnBhcnNlQmxvY2s7XG4gICAgICAgICAgICBwYXJzZUZ1bmN0aW9uU291cmNlRWxlbWVudHMgPSBleHRyYS5wYXJzZUZ1bmN0aW9uU291cmNlRWxlbWVudHM7XG4gICAgICAgICAgICBwYXJzZUNhdGNoQ2xhdXNlID0gZXh0cmEucGFyc2VDYXRjaENsYXVzZTtcbiAgICAgICAgICAgIHBhcnNlQ29tcHV0ZWRNZW1iZXIgPSBleHRyYS5wYXJzZUNvbXB1dGVkTWVtYmVyO1xuICAgICAgICAgICAgcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24gPSBleHRyYS5wYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlQ29uc3RMZXREZWNsYXJhdGlvbiA9IGV4dHJhLnBhcnNlQ29uc3RMZXREZWNsYXJhdGlvbjtcbiAgICAgICAgICAgIHBhcnNlRXF1YWxpdHlFeHByZXNzaW9uID0gZXh0cmEucGFyc2VFcXVhbGl0eUV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZUV4cHJlc3Npb24gPSBleHRyYS5wYXJzZUV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZUZvclZhcmlhYmxlRGVjbGFyYXRpb24gPSBleHRyYS5wYXJzZUZvclZhcmlhYmxlRGVjbGFyYXRpb247XG4gICAgICAgICAgICBwYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb24gPSBleHRyYS5wYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb247XG4gICAgICAgICAgICBwYXJzZUZ1bmN0aW9uRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlRnVuY3Rpb25FeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VHcm91cEV4cHJlc3Npb24gPSBleHRyYS5wYXJzZUdyb3VwRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCA9IGV4dHJhLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbDtcbiAgICAgICAgICAgIHBhcnNlTG9naWNhbEFOREV4cHJlc3Npb24gPSBleHRyYS5wYXJzZUxvZ2ljYWxBTkRFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VMb2dpY2FsT1JFeHByZXNzaW9uID0gZXh0cmEucGFyc2VMb2dpY2FsT1JFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VNdWx0aXBsaWNhdGl2ZUV4cHJlc3Npb24gPSBleHRyYS5wYXJzZU11bHRpcGxpY2F0aXZlRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlTmV3RXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlTmV3RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSA9IGV4dHJhLnBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eTtcbiAgICAgICAgICAgIHBhcnNlT2JqZWN0UHJvcGVydHkgPSBleHRyYS5wYXJzZU9iamVjdFByb3BlcnR5O1xuICAgICAgICAgICAgcGFyc2VPYmplY3RQcm9wZXJ0eUtleSA9IGV4dHJhLnBhcnNlT2JqZWN0UHJvcGVydHlLZXk7XG4gICAgICAgICAgICBwYXJzZVByaW1hcnlFeHByZXNzaW9uID0gZXh0cmEucGFyc2VQcmltYXJ5RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24gPSBleHRyYS5wYXJzZVBvc3RmaXhFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VQcm9ncmFtID0gZXh0cmEucGFyc2VQcm9ncmFtO1xuICAgICAgICAgICAgcGFyc2VQcm9wZXJ0eUZ1bmN0aW9uID0gZXh0cmEucGFyc2VQcm9wZXJ0eUZ1bmN0aW9uO1xuICAgICAgICAgICAgcGFyc2VSZWxhdGlvbmFsRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlUmVsYXRpb25hbEV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZVN0YXRlbWVudCA9IGV4dHJhLnBhcnNlU3RhdGVtZW50O1xuICAgICAgICAgICAgcGFyc2VTaGlmdEV4cHJlc3Npb24gPSBleHRyYS5wYXJzZVNoaWZ0RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlU3dpdGNoQ2FzZSA9IGV4dHJhLnBhcnNlU3dpdGNoQ2FzZTtcbiAgICAgICAgICAgIHBhcnNlVW5hcnlFeHByZXNzaW9uID0gZXh0cmEucGFyc2VVbmFyeUV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24gPSBleHRyYS5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb247XG4gICAgICAgICAgICBwYXJzZVZhcmlhYmxlSWRlbnRpZmllciA9IGV4dHJhLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBleHRyYS5zY2FuUmVnRXhwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBhZHZhbmNlID0gZXh0cmEuYWR2YW5jZTtcbiAgICAgICAgICAgIHNjYW5SZWdFeHAgPSBleHRyYS5zY2FuUmVnRXhwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyaW5nVG9BcnJheShzdHIpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHN0ci5sZW5ndGgsXG4gICAgICAgICAgICByZXN1bHQgPSBbXSxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgcmVzdWx0W2ldID0gc3RyLmNoYXJBdChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlKGNvZGUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHByb2dyYW0sIHRvU3RyaW5nO1xuXG4gICAgICAgIHRvU3RyaW5nID0gU3RyaW5nO1xuICAgICAgICBpZiAodHlwZW9mIGNvZGUgIT09ICdzdHJpbmcnICYmICEoY29kZSBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICAgICAgICAgIGNvZGUgPSB0b1N0cmluZyhjb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNvdXJjZSA9IGNvZGU7XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgbGluZU51bWJlciA9IChzb3VyY2UubGVuZ3RoID4gMCkgPyAxIDogMDtcbiAgICAgICAgbGluZVN0YXJ0ID0gMDtcbiAgICAgICAgbGVuZ3RoID0gc291cmNlLmxlbmd0aDtcbiAgICAgICAgYnVmZmVyID0gbnVsbDtcbiAgICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgbGFiZWxTZXQ6IHt9LFxuICAgICAgICAgICAgaW5GdW5jdGlvbkJvZHk6IGZhbHNlLFxuICAgICAgICAgICAgaW5JdGVyYXRpb246IGZhbHNlLFxuICAgICAgICAgICAgaW5Td2l0Y2g6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgZXh0cmEgPSB7fTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZXh0cmEucmFuZ2UgPSAodHlwZW9mIG9wdGlvbnMucmFuZ2UgPT09ICdib29sZWFuJykgJiYgb3B0aW9ucy5yYW5nZTtcbiAgICAgICAgICAgIGV4dHJhLmxvYyA9ICh0eXBlb2Ygb3B0aW9ucy5sb2MgPT09ICdib29sZWFuJykgJiYgb3B0aW9ucy5sb2M7XG4gICAgICAgICAgICBleHRyYS5yYXcgPSAodHlwZW9mIG9wdGlvbnMucmF3ID09PSAnYm9vbGVhbicpICYmIG9wdGlvbnMucmF3O1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRva2VucyA9PT0gJ2Jvb2xlYW4nICYmIG9wdGlvbnMudG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgZXh0cmEudG9rZW5zID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29tbWVudCA9PT0gJ2Jvb2xlYW4nICYmIG9wdGlvbnMuY29tbWVudCkge1xuICAgICAgICAgICAgICAgIGV4dHJhLmNvbW1lbnRzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudG9sZXJhbnQgPT09ICdib29sZWFuJyAmJiBvcHRpb25zLnRvbGVyYW50KSB7XG4gICAgICAgICAgICAgICAgZXh0cmEuZXJyb3JzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VbMF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IGZpcnN0IHRvIGNvbnZlcnQgdG8gYSBzdHJpbmcuIFRoaXMgaXMgZ29vZCBhcyBmYXN0IHBhdGhcbiAgICAgICAgICAgICAgICAvLyBmb3Igb2xkIElFIHdoaWNoIHVuZGVyc3RhbmRzIHN0cmluZyBpbmRleGluZyBmb3Igc3RyaW5nXG4gICAgICAgICAgICAgICAgLy8gbGl0ZXJhbHMgb25seSBhbmQgbm90IGZvciBzdHJpbmcgb2JqZWN0LlxuICAgICAgICAgICAgICAgIGlmIChjb2RlIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IGNvZGUudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEZvcmNlIGFjY2Vzc2luZyB0aGUgY2hhcmFjdGVycyB2aWEgYW4gYXJyYXkuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VbMF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IHN0cmluZ1RvQXJyYXkoY29kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcGF0Y2goKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb2dyYW0gPSBwYXJzZVByb2dyYW0oKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXh0cmEuY29tbWVudHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyQ29tbWVudExvY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgcHJvZ3JhbS5jb21tZW50cyA9IGV4dHJhLmNvbW1lbnRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyVG9rZW5Mb2NhdGlvbigpO1xuICAgICAgICAgICAgICAgIHByb2dyYW0udG9rZW5zID0gZXh0cmEudG9rZW5zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS5lcnJvcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3JhbS5lcnJvcnMgPSBleHRyYS5lcnJvcnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXh0cmEucmFuZ2UgfHwgZXh0cmEubG9jKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3JhbS5ib2R5ID0gZmlsdGVyR3JvdXAocHJvZ3JhbS5ib2R5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHVucGF0Y2goKTtcbiAgICAgICAgICAgIGV4dHJhID0ge307XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvZ3JhbTtcbiAgICB9XG5cbiAgICAvLyBTeW5jIHdpdGggcGFja2FnZS5qc29uLlxuICAgIGV4cG9ydHMudmVyc2lvbiA9ICcxLjAuNCc7XG5cbiAgICBleHBvcnRzLnBhcnNlID0gcGFyc2U7XG5cbiAgICAvLyBEZWVwIGNvcHkuXG4gICAgZXhwb3J0cy5TeW50YXggPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmFtZSwgdHlwZXMgPSB7fTtcblxuICAgICAgICBpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHR5cGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobmFtZSBpbiBTeW50YXgpIHtcbiAgICAgICAgICAgIGlmIChTeW50YXguaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0eXBlc1tuYW1lXSA9IFN5bnRheFtuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmZyZWV6ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZSh0eXBlcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHlwZXM7XG4gICAgfSgpKTtcblxufSkpO1xuLyogdmltOiBzZXQgc3c9NCB0cz00IGV0IHR3PTgwIDogKi9cbiIsIi8qIVxuICogbXVzdGFjaGUuanMgLSBMb2dpYy1sZXNzIHt7bXVzdGFjaGV9fSB0ZW1wbGF0ZXMgd2l0aCBKYXZhU2NyaXB0XG4gKiBodHRwOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzXG4gKi9cblxuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgZXhwb3J0cykge1xuICAgIGZhY3RvcnkoZXhwb3J0cyk7IC8vIENvbW1vbkpTXG4gIH0gZWxzZSB7XG4gICAgdmFyIG11c3RhY2hlID0ge307XG4gICAgZmFjdG9yeShtdXN0YWNoZSk7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICBkZWZpbmUobXVzdGFjaGUpOyAvLyBBTURcbiAgICB9IGVsc2Uge1xuICAgICAgcm9vdC5NdXN0YWNoZSA9IG11c3RhY2hlOyAvLyA8c2NyaXB0PlxuICAgIH1cbiAgfVxufSh0aGlzLCBmdW5jdGlvbiAobXVzdGFjaGUpIHtcblxuICAvLyBXb3JrYXJvdW5kIGZvciBodHRwczovL2lzc3Vlcy5hcGFjaGUub3JnL2ppcmEvYnJvd3NlL0NPVUNIREItNTc3XG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMTg5XG4gIHZhciBSZWdFeHBfdGVzdCA9IFJlZ0V4cC5wcm90b3R5cGUudGVzdDtcbiAgZnVuY3Rpb24gdGVzdFJlZ0V4cChyZSwgc3RyaW5nKSB7XG4gICAgcmV0dXJuIFJlZ0V4cF90ZXN0LmNhbGwocmUsIHN0cmluZyk7XG4gIH1cblxuICB2YXIgbm9uU3BhY2VSZSA9IC9cXFMvO1xuICBmdW5jdGlvbiBpc1doaXRlc3BhY2Uoc3RyaW5nKSB7XG4gICAgcmV0dXJuICF0ZXN0UmVnRXhwKG5vblNwYWNlUmUsIHN0cmluZyk7XG4gIH1cblxuICB2YXIgT2JqZWN0X3RvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbiAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0X3RvU3RyaW5nLmNhbGwob2JqZWN0KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICBmdW5jdGlvbiBpc0Z1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqZWN0ID09PSAnZnVuY3Rpb24nO1xuICB9XG5cbiAgZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvW1xcLVxcW1xcXXt9KCkqKz8uLFxcXFxcXF4kfCNcXHNdL2csIFwiXFxcXCQmXCIpO1xuICB9XG5cbiAgdmFyIGVudGl0eU1hcCA9IHtcbiAgICBcIiZcIjogXCImYW1wO1wiLFxuICAgIFwiPFwiOiBcIiZsdDtcIixcbiAgICBcIj5cIjogXCImZ3Q7XCIsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmIzM5OycsXG4gICAgXCIvXCI6ICcmI3gyRjsnXG4gIH07XG5cbiAgZnVuY3Rpb24gZXNjYXBlSHRtbChzdHJpbmcpIHtcbiAgICByZXR1cm4gU3RyaW5nKHN0cmluZykucmVwbGFjZSgvWyY8PlwiJ1xcL10vZywgZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBlbnRpdHlNYXBbc107XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBlc2NhcGVUYWdzKHRhZ3MpIHtcbiAgICBpZiAoIWlzQXJyYXkodGFncykgfHwgdGFncy5sZW5ndGggIT09IDIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0YWdzOiAnICsgdGFncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBSZWdFeHAoZXNjYXBlUmVnRXhwKHRhZ3NbMF0pICsgXCJcXFxccypcIiksXG4gICAgICBuZXcgUmVnRXhwKFwiXFxcXHMqXCIgKyBlc2NhcGVSZWdFeHAodGFnc1sxXSkpXG4gICAgXTtcbiAgfVxuXG4gIHZhciB3aGl0ZVJlID0gL1xccyovO1xuICB2YXIgc3BhY2VSZSA9IC9cXHMrLztcbiAgdmFyIGVxdWFsc1JlID0gL1xccyo9LztcbiAgdmFyIGN1cmx5UmUgPSAvXFxzKlxcfS87XG4gIHZhciB0YWdSZSA9IC8jfFxcXnxcXC98PnxcXHt8Jnw9fCEvO1xuXG4gIC8qKlxuICAgKiBCcmVha3MgdXAgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgc3RyaW5nIGludG8gYSB0cmVlIG9mIHRva2Vucy4gSWYgdGhlIGB0YWdzYFxuICAgKiBhcmd1bWVudCBpcyBnaXZlbiBoZXJlIGl0IG11c3QgYmUgYW4gYXJyYXkgd2l0aCB0d28gc3RyaW5nIHZhbHVlczogdGhlXG4gICAqIG9wZW5pbmcgYW5kIGNsb3NpbmcgdGFncyB1c2VkIGluIHRoZSB0ZW1wbGF0ZSAoZS5nLiBbIFwiPCVcIiwgXCIlPlwiIF0pLiBPZlxuICAgKiBjb3Vyc2UsIHRoZSBkZWZhdWx0IGlzIHRvIHVzZSBtdXN0YWNoZXMgKGkuZS4gbXVzdGFjaGUudGFncykuXG4gICAqXG4gICAqIEEgdG9rZW4gaXMgYW4gYXJyYXkgd2l0aCBhdCBsZWFzdCA0IGVsZW1lbnRzLiBUaGUgZmlyc3QgZWxlbWVudCBpcyB0aGVcbiAgICogbXVzdGFjaGUgc3ltYm9sIHRoYXQgd2FzIHVzZWQgaW5zaWRlIHRoZSB0YWcsIGUuZy4gXCIjXCIgb3IgXCImXCIuIElmIHRoZSB0YWdcbiAgICogZGlkIG5vdCBjb250YWluIGEgc3ltYm9sIChpLmUuIHt7bXlWYWx1ZX19KSB0aGlzIGVsZW1lbnQgaXMgXCJuYW1lXCIuIEZvclxuICAgKiBhbGwgdGV4dCB0aGF0IGFwcGVhcnMgb3V0c2lkZSBhIHN5bWJvbCB0aGlzIGVsZW1lbnQgaXMgXCJ0ZXh0XCIuXG4gICAqXG4gICAqIFRoZSBzZWNvbmQgZWxlbWVudCBvZiBhIHRva2VuIGlzIGl0cyBcInZhbHVlXCIuIEZvciBtdXN0YWNoZSB0YWdzIHRoaXMgaXNcbiAgICogd2hhdGV2ZXIgZWxzZSB3YXMgaW5zaWRlIHRoZSB0YWcgYmVzaWRlcyB0aGUgb3BlbmluZyBzeW1ib2wuIEZvciB0ZXh0IHRva2Vuc1xuICAgKiB0aGlzIGlzIHRoZSB0ZXh0IGl0c2VsZi5cbiAgICpcbiAgICogVGhlIHRoaXJkIGFuZCBmb3VydGggZWxlbWVudHMgb2YgdGhlIHRva2VuIGFyZSB0aGUgc3RhcnQgYW5kIGVuZCBpbmRpY2VzLFxuICAgKiByZXNwZWN0aXZlbHksIG9mIHRoZSB0b2tlbiBpbiB0aGUgb3JpZ2luYWwgdGVtcGxhdGUuXG4gICAqXG4gICAqIFRva2VucyB0aGF0IGFyZSB0aGUgcm9vdCBub2RlIG9mIGEgc3VidHJlZSBjb250YWluIHR3byBtb3JlIGVsZW1lbnRzOiAxKSBhblxuICAgKiBhcnJheSBvZiB0b2tlbnMgaW4gdGhlIHN1YnRyZWUgYW5kIDIpIHRoZSBpbmRleCBpbiB0aGUgb3JpZ2luYWwgdGVtcGxhdGUgYXRcbiAgICogd2hpY2ggdGhlIGNsb3NpbmcgdGFnIGZvciB0aGF0IHNlY3Rpb24gYmVnaW5zLlxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VUZW1wbGF0ZSh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHRhZ3MgPSB0YWdzIHx8IG11c3RhY2hlLnRhZ3M7XG4gICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZSB8fCAnJztcblxuICAgIGlmICh0eXBlb2YgdGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRhZ3MgPSB0YWdzLnNwbGl0KHNwYWNlUmUpO1xuICAgIH1cblxuICAgIHZhciB0YWdSZXMgPSBlc2NhcGVUYWdzKHRhZ3MpO1xuICAgIHZhciBzY2FubmVyID0gbmV3IFNjYW5uZXIodGVtcGxhdGUpO1xuXG4gICAgdmFyIHNlY3Rpb25zID0gW107ICAgICAvLyBTdGFjayB0byBob2xkIHNlY3Rpb24gdG9rZW5zXG4gICAgdmFyIHRva2VucyA9IFtdOyAgICAgICAvLyBCdWZmZXIgdG8gaG9sZCB0aGUgdG9rZW5zXG4gICAgdmFyIHNwYWNlcyA9IFtdOyAgICAgICAvLyBJbmRpY2VzIG9mIHdoaXRlc3BhY2UgdG9rZW5zIG9uIHRoZSBjdXJyZW50IGxpbmVcbiAgICB2YXIgaGFzVGFnID0gZmFsc2U7ICAgIC8vIElzIHRoZXJlIGEge3t0YWd9fSBvbiB0aGUgY3VycmVudCBsaW5lP1xuICAgIHZhciBub25TcGFjZSA9IGZhbHNlOyAgLy8gSXMgdGhlcmUgYSBub24tc3BhY2UgY2hhciBvbiB0aGUgY3VycmVudCBsaW5lP1xuXG4gICAgLy8gU3RyaXBzIGFsbCB3aGl0ZXNwYWNlIHRva2VucyBhcnJheSBmb3IgdGhlIGN1cnJlbnQgbGluZVxuICAgIC8vIGlmIHRoZXJlIHdhcyBhIHt7I3RhZ319IG9uIGl0IGFuZCBvdGhlcndpc2Ugb25seSBzcGFjZS5cbiAgICBmdW5jdGlvbiBzdHJpcFNwYWNlKCkge1xuICAgICAgaWYgKGhhc1RhZyAmJiAhbm9uU3BhY2UpIHtcbiAgICAgICAgd2hpbGUgKHNwYWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICBkZWxldGUgdG9rZW5zW3NwYWNlcy5wb3AoKV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwYWNlcyA9IFtdO1xuICAgICAgfVxuXG4gICAgICBoYXNUYWcgPSBmYWxzZTtcbiAgICAgIG5vblNwYWNlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHN0YXJ0LCB0eXBlLCB2YWx1ZSwgY2hyLCB0b2tlbiwgb3BlblNlY3Rpb247XG4gICAgd2hpbGUgKCFzY2FubmVyLmVvcygpKSB7XG4gICAgICBzdGFydCA9IHNjYW5uZXIucG9zO1xuXG4gICAgICAvLyBNYXRjaCBhbnkgdGV4dCBiZXR3ZWVuIHRhZ3MuXG4gICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKHRhZ1Jlc1swXSk7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgY2hyID0gdmFsdWUuY2hhckF0KGkpO1xuXG4gICAgICAgICAgaWYgKGlzV2hpdGVzcGFjZShjaHIpKSB7XG4gICAgICAgICAgICBzcGFjZXMucHVzaCh0b2tlbnMubGVuZ3RoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRva2Vucy5wdXNoKFsndGV4dCcsIGNociwgc3RhcnQsIHN0YXJ0ICsgMV0pO1xuICAgICAgICAgIHN0YXJ0ICs9IDE7XG5cbiAgICAgICAgICAvLyBDaGVjayBmb3Igd2hpdGVzcGFjZSBvbiB0aGUgY3VycmVudCBsaW5lLlxuICAgICAgICAgIGlmIChjaHIgPT09ICdcXG4nKSB7XG4gICAgICAgICAgICBzdHJpcFNwYWNlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1hdGNoIHRoZSBvcGVuaW5nIHRhZy5cbiAgICAgIGlmICghc2Nhbm5lci5zY2FuKHRhZ1Jlc1swXSkpIGJyZWFrO1xuICAgICAgaGFzVGFnID0gdHJ1ZTtcblxuICAgICAgLy8gR2V0IHRoZSB0YWcgdHlwZS5cbiAgICAgIHR5cGUgPSBzY2FubmVyLnNjYW4odGFnUmUpIHx8ICduYW1lJztcbiAgICAgIHNjYW5uZXIuc2Nhbih3aGl0ZVJlKTtcblxuICAgICAgLy8gR2V0IHRoZSB0YWcgdmFsdWUuXG4gICAgICBpZiAodHlwZSA9PT0gJz0nKSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwoZXF1YWxzUmUpO1xuICAgICAgICBzY2FubmVyLnNjYW4oZXF1YWxzUmUpO1xuICAgICAgICBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMV0pO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAneycpIHtcbiAgICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbChuZXcgUmVnRXhwKCdcXFxccyonICsgZXNjYXBlUmVnRXhwKCd9JyArIHRhZ3NbMV0pKSk7XG4gICAgICAgIHNjYW5uZXIuc2NhbihjdXJseVJlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuVW50aWwodGFnUmVzWzFdKTtcbiAgICAgICAgdHlwZSA9ICcmJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwodGFnUmVzWzFdKTtcbiAgICAgIH1cblxuICAgICAgLy8gTWF0Y2ggdGhlIGNsb3NpbmcgdGFnLlxuICAgICAgaWYgKCFzY2FubmVyLnNjYW4odGFnUmVzWzFdKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuY2xvc2VkIHRhZyBhdCAnICsgc2Nhbm5lci5wb3MpO1xuICAgICAgfVxuXG4gICAgICB0b2tlbiA9IFsgdHlwZSwgdmFsdWUsIHN0YXJ0LCBzY2FubmVyLnBvcyBdO1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuXG4gICAgICBpZiAodHlwZSA9PT0gJyMnIHx8IHR5cGUgPT09ICdeJykge1xuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJy8nKSB7XG4gICAgICAgIC8vIENoZWNrIHNlY3Rpb24gbmVzdGluZy5cbiAgICAgICAgb3BlblNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcblxuICAgICAgICBpZiAoIW9wZW5TZWN0aW9uKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbm9wZW5lZCBzZWN0aW9uIFwiJyArIHZhbHVlICsgJ1wiIGF0ICcgKyBzdGFydCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wZW5TZWN0aW9uWzFdICE9PSB2YWx1ZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgc2VjdGlvbiBcIicgKyBvcGVuU2VjdGlvblsxXSArICdcIiBhdCAnICsgc3RhcnQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICduYW1lJyB8fCB0eXBlID09PSAneycgfHwgdHlwZSA9PT0gJyYnKSB7XG4gICAgICAgIG5vblNwYWNlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJz0nKSB7XG4gICAgICAgIC8vIFNldCB0aGUgdGFncyBmb3IgdGhlIG5leHQgdGltZSBhcm91bmQuXG4gICAgICAgIHRhZ1JlcyA9IGVzY2FwZVRhZ3ModGFncyA9IHZhbHVlLnNwbGl0KHNwYWNlUmUpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlcmUgYXJlIG5vIG9wZW4gc2VjdGlvbnMgd2hlbiB3ZSdyZSBkb25lLlxuICAgIG9wZW5TZWN0aW9uID0gc2VjdGlvbnMucG9wKCk7XG4gICAgaWYgKG9wZW5TZWN0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuY2xvc2VkIHNlY3Rpb24gXCInICsgb3BlblNlY3Rpb25bMV0gKyAnXCIgYXQgJyArIHNjYW5uZXIucG9zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmVzdFRva2VucyhzcXVhc2hUb2tlbnModG9rZW5zKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tYmluZXMgdGhlIHZhbHVlcyBvZiBjb25zZWN1dGl2ZSB0ZXh0IHRva2VucyBpbiB0aGUgZ2l2ZW4gYHRva2Vuc2AgYXJyYXlcbiAgICogdG8gYSBzaW5nbGUgdG9rZW4uXG4gICAqL1xuICBmdW5jdGlvbiBzcXVhc2hUb2tlbnModG9rZW5zKSB7XG4gICAgdmFyIHNxdWFzaGVkVG9rZW5zID0gW107XG5cbiAgICB2YXIgdG9rZW4sIGxhc3RUb2tlbjtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcblxuICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgIGlmICh0b2tlblswXSA9PT0gJ3RleHQnICYmIGxhc3RUb2tlbiAmJiBsYXN0VG9rZW5bMF0gPT09ICd0ZXh0Jykge1xuICAgICAgICAgIGxhc3RUb2tlblsxXSArPSB0b2tlblsxXTtcbiAgICAgICAgICBsYXN0VG9rZW5bM10gPSB0b2tlblszXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcXVhc2hlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBsYXN0VG9rZW4gPSB0b2tlbjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzcXVhc2hlZFRva2VucztcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JtcyB0aGUgZ2l2ZW4gYXJyYXkgb2YgYHRva2Vuc2AgaW50byBhIG5lc3RlZCB0cmVlIHN0cnVjdHVyZSB3aGVyZVxuICAgKiB0b2tlbnMgdGhhdCByZXByZXNlbnQgYSBzZWN0aW9uIGhhdmUgdHdvIGFkZGl0aW9uYWwgaXRlbXM6IDEpIGFuIGFycmF5IG9mXG4gICAqIGFsbCB0b2tlbnMgdGhhdCBhcHBlYXIgaW4gdGhhdCBzZWN0aW9uIGFuZCAyKSB0aGUgaW5kZXggaW4gdGhlIG9yaWdpbmFsXG4gICAqIHRlbXBsYXRlIHRoYXQgcmVwcmVzZW50cyB0aGUgZW5kIG9mIHRoYXQgc2VjdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIG5lc3RUb2tlbnModG9rZW5zKSB7XG4gICAgdmFyIG5lc3RlZFRva2VucyA9IFtdO1xuICAgIHZhciBjb2xsZWN0b3IgPSBuZXN0ZWRUb2tlbnM7XG4gICAgdmFyIHNlY3Rpb25zID0gW107XG5cbiAgICB2YXIgdG9rZW4sIHNlY3Rpb247XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG5cbiAgICAgIHN3aXRjaCAodG9rZW5bMF0pIHtcbiAgICAgIGNhc2UgJyMnOlxuICAgICAgY2FzZSAnXic6XG4gICAgICAgIGNvbGxlY3Rvci5wdXNoKHRva2VuKTtcbiAgICAgICAgc2VjdGlvbnMucHVzaCh0b2tlbik7XG4gICAgICAgIGNvbGxlY3RvciA9IHRva2VuWzRdID0gW107XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnLyc6XG4gICAgICAgIHNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcbiAgICAgICAgc2VjdGlvbls1XSA9IHRva2VuWzJdO1xuICAgICAgICBjb2xsZWN0b3IgPSBzZWN0aW9ucy5sZW5ndGggPiAwID8gc2VjdGlvbnNbc2VjdGlvbnMubGVuZ3RoIC0gMV1bNF0gOiBuZXN0ZWRUb2tlbnM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXN0ZWRUb2tlbnM7XG4gIH1cblxuICAvKipcbiAgICogQSBzaW1wbGUgc3RyaW5nIHNjYW5uZXIgdGhhdCBpcyB1c2VkIGJ5IHRoZSB0ZW1wbGF0ZSBwYXJzZXIgdG8gZmluZFxuICAgKiB0b2tlbnMgaW4gdGVtcGxhdGUgc3RyaW5ncy5cbiAgICovXG4gIGZ1bmN0aW9uIFNjYW5uZXIoc3RyaW5nKSB7XG4gICAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG4gICAgdGhpcy50YWlsID0gc3RyaW5nO1xuICAgIHRoaXMucG9zID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdGFpbCBpcyBlbXB0eSAoZW5kIG9mIHN0cmluZykuXG4gICAqL1xuICBTY2FubmVyLnByb3RvdHlwZS5lb3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGFpbCA9PT0gXCJcIjtcbiAgfTtcblxuICAvKipcbiAgICogVHJpZXMgdG8gbWF0Y2ggdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbiBhdCB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICogUmV0dXJucyB0aGUgbWF0Y2hlZCB0ZXh0IGlmIGl0IGNhbiBtYXRjaCwgdGhlIGVtcHR5IHN0cmluZyBvdGhlcndpc2UuXG4gICAqL1xuICBTY2FubmVyLnByb3RvdHlwZS5zY2FuID0gZnVuY3Rpb24gKHJlKSB7XG4gICAgdmFyIG1hdGNoID0gdGhpcy50YWlsLm1hdGNoKHJlKTtcblxuICAgIGlmIChtYXRjaCAmJiBtYXRjaC5pbmRleCA9PT0gMCkge1xuICAgICAgdmFyIHN0cmluZyA9IG1hdGNoWzBdO1xuICAgICAgdGhpcy50YWlsID0gdGhpcy50YWlsLnN1YnN0cmluZyhzdHJpbmcubGVuZ3RoKTtcbiAgICAgIHRoaXMucG9zICs9IHN0cmluZy5sZW5ndGg7XG4gICAgICByZXR1cm4gc3RyaW5nO1xuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTa2lwcyBhbGwgdGV4dCB1bnRpbCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uIGNhbiBiZSBtYXRjaGVkLiBSZXR1cm5zXG4gICAqIHRoZSBza2lwcGVkIHN0cmluZywgd2hpY2ggaXMgdGhlIGVudGlyZSB0YWlsIGlmIG5vIG1hdGNoIGNhbiBiZSBtYWRlLlxuICAgKi9cbiAgU2Nhbm5lci5wcm90b3R5cGUuc2NhblVudGlsID0gZnVuY3Rpb24gKHJlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy50YWlsLnNlYXJjaChyZSksIG1hdGNoO1xuXG4gICAgc3dpdGNoIChpbmRleCkge1xuICAgIGNhc2UgLTE6XG4gICAgICBtYXRjaCA9IHRoaXMudGFpbDtcbiAgICAgIHRoaXMudGFpbCA9IFwiXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDA6XG4gICAgICBtYXRjaCA9IFwiXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWF0Y2ggPSB0aGlzLnRhaWwuc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgIHRoaXMudGFpbCA9IHRoaXMudGFpbC5zdWJzdHJpbmcoaW5kZXgpO1xuICAgIH1cblxuICAgIHRoaXMucG9zICs9IG1hdGNoLmxlbmd0aDtcblxuICAgIHJldHVybiBtYXRjaDtcbiAgfTtcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhIHJlbmRlcmluZyBjb250ZXh0IGJ5IHdyYXBwaW5nIGEgdmlldyBvYmplY3QgYW5kXG4gICAqIG1haW50YWluaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBwYXJlbnQgY29udGV4dC5cbiAgICovXG4gIGZ1bmN0aW9uIENvbnRleHQodmlldywgcGFyZW50Q29udGV4dCkge1xuICAgIHRoaXMudmlldyA9IHZpZXcgPT0gbnVsbCA/IHt9IDogdmlldztcbiAgICB0aGlzLmNhY2hlID0geyAnLic6IHRoaXMudmlldyB9O1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50Q29udGV4dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbnRleHQgdXNpbmcgdGhlIGdpdmVuIHZpZXcgd2l0aCB0aGlzIGNvbnRleHRcbiAgICogYXMgdGhlIHBhcmVudC5cbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodmlldykge1xuICAgIHJldHVybiBuZXcgQ29udGV4dCh2aWV3LCB0aGlzKTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGdpdmVuIG5hbWUgaW4gdGhpcyBjb250ZXh0LCB0cmF2ZXJzaW5nXG4gICAqIHVwIHRoZSBjb250ZXh0IGhpZXJhcmNoeSBpZiB0aGUgdmFsdWUgaXMgYWJzZW50IGluIHRoaXMgY29udGV4dCdzIHZpZXcuXG4gICAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5sb29rdXAgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAobmFtZSBpbiB0aGlzLmNhY2hlKSB7XG4gICAgICB2YWx1ZSA9IHRoaXMuY2FjaGVbbmFtZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcblxuICAgICAgd2hpbGUgKGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignLicpID4gMCkge1xuICAgICAgICAgIHZhbHVlID0gY29udGV4dC52aWV3O1xuXG4gICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdCgnLicpLCBpID0gMDtcbiAgICAgICAgICB3aGlsZSAodmFsdWUgIT0gbnVsbCAmJiBpIDwgbmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlW25hbWVzW2krK11dO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IGNvbnRleHQudmlld1tuYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSBicmVhaztcblxuICAgICAgICBjb250ZXh0ID0gY29udGV4dC5wYXJlbnQ7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2FjaGVbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUuY2FsbCh0aGlzLnZpZXcpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQSBXcml0ZXIga25vd3MgaG93IHRvIHRha2UgYSBzdHJlYW0gb2YgdG9rZW5zIGFuZCByZW5kZXIgdGhlbSB0byBhXG4gICAqIHN0cmluZywgZ2l2ZW4gYSBjb250ZXh0LiBJdCBhbHNvIG1haW50YWlucyBhIGNhY2hlIG9mIHRlbXBsYXRlcyB0b1xuICAgKiBhdm9pZCB0aGUgbmVlZCB0byBwYXJzZSB0aGUgc2FtZSB0ZW1wbGF0ZSB0d2ljZS5cbiAgICovXG4gIGZ1bmN0aW9uIFdyaXRlcigpIHtcbiAgICB0aGlzLmNhY2hlID0ge307XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBjYWNoZWQgdGVtcGxhdGVzIGluIHRoaXMgd3JpdGVyLlxuICAgKi9cbiAgV3JpdGVyLnByb3RvdHlwZS5jbGVhckNhY2hlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY2FjaGUgPSB7fTtcbiAgfTtcblxuICAvKipcbiAgICogUGFyc2VzIGFuZCBjYWNoZXMgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgYW5kIHJldHVybnMgdGhlIGFycmF5IG9mIHRva2Vuc1xuICAgKiB0aGF0IGlzIGdlbmVyYXRlZCBmcm9tIHRoZSBwYXJzZS5cbiAgICovXG4gIFdyaXRlci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHRhZ3MpIHtcbiAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlO1xuICAgIHZhciB0b2tlbnMgPSBjYWNoZVt0ZW1wbGF0ZV07XG5cbiAgICBpZiAodG9rZW5zID09IG51bGwpIHtcbiAgICAgIHRva2VucyA9IGNhY2hlW3RlbXBsYXRlXSA9IHBhcnNlVGVtcGxhdGUodGVtcGxhdGUsIHRhZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB0b2tlbnM7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhpZ2gtbGV2ZWwgbWV0aG9kIHRoYXQgaXMgdXNlZCB0byByZW5kZXIgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgd2l0aFxuICAgKiB0aGUgZ2l2ZW4gYHZpZXdgLlxuICAgKlxuICAgKiBUaGUgb3B0aW9uYWwgYHBhcnRpYWxzYCBhcmd1bWVudCBtYXkgYmUgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlXG4gICAqIG5hbWVzIGFuZCB0ZW1wbGF0ZXMgb2YgcGFydGlhbHMgdGhhdCBhcmUgdXNlZCBpbiB0aGUgdGVtcGxhdGUuIEl0IG1heVxuICAgKiBhbHNvIGJlIGEgZnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGxvYWQgcGFydGlhbCB0ZW1wbGF0ZXMgb24gdGhlIGZseVxuICAgKiB0aGF0IHRha2VzIGEgc2luZ2xlIGFyZ3VtZW50OiB0aGUgbmFtZSBvZiB0aGUgcGFydGlhbC5cbiAgICovXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscykge1xuICAgIHZhciB0b2tlbnMgPSB0aGlzLnBhcnNlKHRlbXBsYXRlKTtcbiAgICB2YXIgY29udGV4dCA9ICh2aWV3IGluc3RhbmNlb2YgQ29udGV4dCkgPyB2aWV3IDogbmV3IENvbnRleHQodmlldyk7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyVG9rZW5zKHRva2VucywgY29udGV4dCwgcGFydGlhbHMsIHRlbXBsYXRlKTtcbiAgfTtcblxuICAvKipcbiAgICogTG93LWxldmVsIG1ldGhvZCB0aGF0IHJlbmRlcnMgdGhlIGdpdmVuIGFycmF5IG9mIGB0b2tlbnNgIHVzaW5nXG4gICAqIHRoZSBnaXZlbiBgY29udGV4dGAgYW5kIGBwYXJ0aWFsc2AuXG4gICAqXG4gICAqIE5vdGU6IFRoZSBgb3JpZ2luYWxUZW1wbGF0ZWAgaXMgb25seSBldmVyIHVzZWQgdG8gZXh0cmFjdCB0aGUgcG9ydGlvblxuICAgKiBvZiB0aGUgb3JpZ2luYWwgdGVtcGxhdGUgdGhhdCB3YXMgY29udGFpbmVkIGluIGEgaGlnaGVyLW9yZGVyIHNlY3Rpb24uXG4gICAqIElmIHRoZSB0ZW1wbGF0ZSBkb2Vzbid0IHVzZSBoaWdoZXItb3JkZXIgc2VjdGlvbnMsIHRoaXMgYXJndW1lbnQgbWF5XG4gICAqIGJlIG9taXR0ZWQuXG4gICAqL1xuICBXcml0ZXIucHJvdG90eXBlLnJlbmRlclRva2VucyA9IGZ1bmN0aW9uICh0b2tlbnMsIGNvbnRleHQsIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKSB7XG4gICAgdmFyIGJ1ZmZlciA9ICcnO1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIHJlbmRlciBhbiBhcmJpdHJhcnkgdGVtcGxhdGVcbiAgICAvLyBpbiB0aGUgY3VycmVudCBjb250ZXh0IGJ5IGhpZ2hlci1vcmRlciBzZWN0aW9ucy5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gc3ViUmVuZGVyKHRlbXBsYXRlKSB7XG4gICAgICByZXR1cm4gc2VsZi5yZW5kZXIodGVtcGxhdGUsIGNvbnRleHQsIHBhcnRpYWxzKTtcbiAgICB9XG5cbiAgICB2YXIgdG9rZW4sIHZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuXG4gICAgICBzd2l0Y2ggKHRva2VuWzBdKSB7XG4gICAgICBjYXNlICcjJzpcbiAgICAgICAgdmFsdWUgPSBjb250ZXh0Lmxvb2t1cCh0b2tlblsxXSk7XG4gICAgICAgIGlmICghdmFsdWUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBqbGVuID0gdmFsdWUubGVuZ3RoOyBqIDwgamxlbjsgKytqKSB7XG4gICAgICAgICAgICBidWZmZXIgKz0gdGhpcy5yZW5kZXJUb2tlbnModG9rZW5bNF0sIGNvbnRleHQucHVzaCh2YWx1ZVtqXSksIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgYnVmZmVyICs9IHRoaXMucmVuZGVyVG9rZW5zKHRva2VuWzRdLCBjb250ZXh0LnB1c2godmFsdWUpLCBwYXJ0aWFscywgb3JpZ2luYWxUZW1wbGF0ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIG9yaWdpbmFsVGVtcGxhdGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgaGlnaGVyLW9yZGVyIHNlY3Rpb25zIHdpdGhvdXQgdGhlIG9yaWdpbmFsIHRlbXBsYXRlJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRXh0cmFjdCB0aGUgcG9ydGlvbiBvZiB0aGUgb3JpZ2luYWwgdGVtcGxhdGUgdGhhdCB0aGUgc2VjdGlvbiBjb250YWlucy5cbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwoY29udGV4dC52aWV3LCBvcmlnaW5hbFRlbXBsYXRlLnNsaWNlKHRva2VuWzNdLCB0b2tlbls1XSksIHN1YlJlbmRlcik7XG5cbiAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkgYnVmZmVyICs9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJ1ZmZlciArPSB0aGlzLnJlbmRlclRva2Vucyh0b2tlbls0XSwgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdeJzpcbiAgICAgICAgdmFsdWUgPSBjb250ZXh0Lmxvb2t1cCh0b2tlblsxXSk7XG5cbiAgICAgICAgLy8gVXNlIEphdmFTY3JpcHQncyBkZWZpbml0aW9uIG9mIGZhbHN5LiBJbmNsdWRlIGVtcHR5IGFycmF5cy5cbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8xODZcbiAgICAgICAgaWYgKCF2YWx1ZSB8fCAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgIGJ1ZmZlciArPSB0aGlzLnJlbmRlclRva2Vucyh0b2tlbls0XSwgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc+JzpcbiAgICAgICAgaWYgKCFwYXJ0aWFscykgY29udGludWU7XG4gICAgICAgIHZhbHVlID0gaXNGdW5jdGlvbihwYXJ0aWFscykgPyBwYXJ0aWFscyh0b2tlblsxXSkgOiBwYXJ0aWFsc1t0b2tlblsxXV07XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSBidWZmZXIgKz0gdGhpcy5yZW5kZXJUb2tlbnModGhpcy5wYXJzZSh2YWx1ZSksIGNvbnRleHQsIHBhcnRpYWxzLCB2YWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnJic6XG4gICAgICAgIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5bMV0pO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkgYnVmZmVyICs9IHZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ25hbWUnOlxuICAgICAgICB2YWx1ZSA9IGNvbnRleHQubG9va3VwKHRva2VuWzFdKTtcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIGJ1ZmZlciArPSBtdXN0YWNoZS5lc2NhcGUodmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICBidWZmZXIgKz0gdG9rZW5bMV07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBidWZmZXI7XG4gIH07XG5cbiAgbXVzdGFjaGUubmFtZSA9IFwibXVzdGFjaGUuanNcIjtcbiAgbXVzdGFjaGUudmVyc2lvbiA9IFwiMC44LjFcIjtcbiAgbXVzdGFjaGUudGFncyA9IFsgXCJ7e1wiLCBcIn19XCIgXTtcblxuICAvLyBBbGwgaGlnaC1sZXZlbCBtdXN0YWNoZS4qIGZ1bmN0aW9ucyB1c2UgdGhpcyB3cml0ZXIuXG4gIHZhciBkZWZhdWx0V3JpdGVyID0gbmV3IFdyaXRlcigpO1xuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIGNhY2hlZCB0ZW1wbGF0ZXMgaW4gdGhlIGRlZmF1bHQgd3JpdGVyLlxuICAgKi9cbiAgbXVzdGFjaGUuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5jbGVhckNhY2hlKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhbmQgY2FjaGVzIHRoZSBnaXZlbiB0ZW1wbGF0ZSBpbiB0aGUgZGVmYXVsdCB3cml0ZXIgYW5kIHJldHVybnMgdGhlXG4gICAqIGFycmF5IG9mIHRva2VucyBpdCBjb250YWlucy4gRG9pbmcgdGhpcyBhaGVhZCBvZiB0aW1lIGF2b2lkcyB0aGUgbmVlZCB0b1xuICAgKiBwYXJzZSB0ZW1wbGF0ZXMgb24gdGhlIGZseSBhcyB0aGV5IGFyZSByZW5kZXJlZC5cbiAgICovXG4gIG11c3RhY2hlLnBhcnNlID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRXcml0ZXIucGFyc2UodGVtcGxhdGUsIHRhZ3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHRoZSBgdGVtcGxhdGVgIHdpdGggdGhlIGdpdmVuIGB2aWV3YCBhbmQgYHBhcnRpYWxzYCB1c2luZyB0aGVcbiAgICogZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBtdXN0YWNoZS5yZW5kZXIgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRXcml0ZXIucmVuZGVyKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscyk7XG4gIH07XG5cbiAgLy8gVGhpcyBpcyBoZXJlIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIDAuNC54LlxuICBtdXN0YWNoZS50b19odG1sID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscywgc2VuZCkge1xuICAgIHZhciByZXN1bHQgPSBtdXN0YWNoZS5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKHNlbmQpKSB7XG4gICAgICBzZW5kKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgZXNjYXBpbmcgZnVuY3Rpb24gc28gdGhhdCB0aGUgdXNlciBtYXkgb3ZlcnJpZGUgaXQuXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMjQ0XG4gIG11c3RhY2hlLmVzY2FwZSA9IGVzY2FwZUh0bWw7XG5cbiAgLy8gRXhwb3J0IHRoZXNlIG1haW5seSBmb3IgdGVzdGluZywgYnV0IGFsc28gZm9yIGFkdmFuY2VkIHVzYWdlLlxuICBtdXN0YWNoZS5TY2FubmVyID0gU2Nhbm5lcjtcbiAgbXVzdGFjaGUuQ29udGV4dCA9IENvbnRleHQ7XG4gIG11c3RhY2hlLldyaXRlciA9IFdyaXRlcjtcblxufSkpO1xuIiwiLy8gICAgIFVuZGVyc2NvcmUuanMgMS42LjBcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGV4cG9ydHNgIG9uIHRoZSBzZXJ2ZXIuXG4gIHZhciByb290ID0gdGhpcztcblxuICAvLyBTYXZlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYF9gIHZhcmlhYmxlLlxuICB2YXIgcHJldmlvdXNVbmRlcnNjb3JlID0gcm9vdC5fO1xuXG4gIC8vIEVzdGFibGlzaCB0aGUgb2JqZWN0IHRoYXQgZ2V0cyByZXR1cm5lZCB0byBicmVhayBvdXQgb2YgYSBsb29wIGl0ZXJhdGlvbi5cbiAgdmFyIGJyZWFrZXIgPSB7fTtcblxuICAvLyBTYXZlIGJ5dGVzIGluIHRoZSBtaW5pZmllZCAoYnV0IG5vdCBnemlwcGVkKSB2ZXJzaW9uOlxuICB2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZSwgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlLCBGdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbiAgLy8gQ3JlYXRlIHF1aWNrIHJlZmVyZW5jZSB2YXJpYWJsZXMgZm9yIHNwZWVkIGFjY2VzcyB0byBjb3JlIHByb3RvdHlwZXMuXG4gIHZhclxuICAgIHB1c2ggICAgICAgICAgICAgPSBBcnJheVByb3RvLnB1c2gsXG4gICAgc2xpY2UgICAgICAgICAgICA9IEFycmF5UHJvdG8uc2xpY2UsXG4gICAgY29uY2F0ICAgICAgICAgICA9IEFycmF5UHJvdG8uY29uY2F0LFxuICAgIHRvU3RyaW5nICAgICAgICAgPSBPYmpQcm90by50b1N0cmluZyxcbiAgICBoYXNPd25Qcm9wZXJ0eSAgID0gT2JqUHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gQWxsICoqRUNNQVNjcmlwdCA1KiogbmF0aXZlIGZ1bmN0aW9uIGltcGxlbWVudGF0aW9ucyB0aGF0IHdlIGhvcGUgdG8gdXNlXG4gIC8vIGFyZSBkZWNsYXJlZCBoZXJlLlxuICB2YXJcbiAgICBuYXRpdmVGb3JFYWNoICAgICAgPSBBcnJheVByb3RvLmZvckVhY2gsXG4gICAgbmF0aXZlTWFwICAgICAgICAgID0gQXJyYXlQcm90by5tYXAsXG4gICAgbmF0aXZlUmVkdWNlICAgICAgID0gQXJyYXlQcm90by5yZWR1Y2UsXG4gICAgbmF0aXZlUmVkdWNlUmlnaHQgID0gQXJyYXlQcm90by5yZWR1Y2VSaWdodCxcbiAgICBuYXRpdmVGaWx0ZXIgICAgICAgPSBBcnJheVByb3RvLmZpbHRlcixcbiAgICBuYXRpdmVFdmVyeSAgICAgICAgPSBBcnJheVByb3RvLmV2ZXJ5LFxuICAgIG5hdGl2ZVNvbWUgICAgICAgICA9IEFycmF5UHJvdG8uc29tZSxcbiAgICBuYXRpdmVJbmRleE9mICAgICAgPSBBcnJheVByb3RvLmluZGV4T2YsXG4gICAgbmF0aXZlTGFzdEluZGV4T2YgID0gQXJyYXlQcm90by5sYXN0SW5kZXhPZixcbiAgICBuYXRpdmVJc0FycmF5ICAgICAgPSBBcnJheS5pc0FycmF5LFxuICAgIG5hdGl2ZUtleXMgICAgICAgICA9IE9iamVjdC5rZXlzLFxuICAgIG5hdGl2ZUJpbmQgICAgICAgICA9IEZ1bmNQcm90by5iaW5kO1xuXG4gIC8vIENyZWF0ZSBhIHNhZmUgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgdXNlIGJlbG93LlxuICB2YXIgXyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBfKSByZXR1cm4gb2JqO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBfKSkgcmV0dXJuIG5ldyBfKG9iaik7XG4gICAgdGhpcy5fd3JhcHBlZCA9IG9iajtcbiAgfTtcblxuICAvLyBFeHBvcnQgdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciAqKk5vZGUuanMqKiwgd2l0aFxuICAvLyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3IgdGhlIG9sZCBgcmVxdWlyZSgpYCBBUEkuIElmIHdlJ3JlIGluXG4gIC8vIHRoZSBicm93c2VyLCBhZGQgYF9gIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgXCJhZHZhbmNlZFwiIG1vZGUuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IF87XG4gICAgfVxuICAgIGV4cG9ydHMuXyA9IF87XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5fID0gXztcbiAgfVxuXG4gIC8vIEN1cnJlbnQgdmVyc2lvbi5cbiAgXy5WRVJTSU9OID0gJzEuNi4wJztcblxuICAvLyBDb2xsZWN0aW9uIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRoZSBjb3JuZXJzdG9uZSwgYW4gYGVhY2hgIGltcGxlbWVudGF0aW9uLCBha2EgYGZvckVhY2hgLlxuICAvLyBIYW5kbGVzIG9iamVjdHMgd2l0aCB0aGUgYnVpbHQtaW4gYGZvckVhY2hgLCBhcnJheXMsIGFuZCByYXcgb2JqZWN0cy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZvckVhY2hgIGlmIGF2YWlsYWJsZS5cbiAgdmFyIGVhY2ggPSBfLmVhY2ggPSBfLmZvckVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gb2JqO1xuICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXlzW2ldXSwga2V5c1tpXSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0b3IgdG8gZWFjaCBlbGVtZW50LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbWFwYCBpZiBhdmFpbGFibGUuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlTWFwICYmIG9iai5tYXAgPT09IG5hdGl2ZU1hcCkgcmV0dXJuIG9iai5tYXAoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIHZhciByZWR1Y2VFcnJvciA9ICdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJztcblxuICAvLyAqKlJlZHVjZSoqIGJ1aWxkcyB1cCBhIHNpbmdsZSByZXN1bHQgZnJvbSBhIGxpc3Qgb2YgdmFsdWVzLCBha2EgYGluamVjdGAsXG4gIC8vIG9yIGBmb2xkbGAuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2UgPSBfLmZvbGRsID0gXy5pbmplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2UgJiYgb2JqLnJlZHVjZSA9PT0gbmF0aXZlUmVkdWNlKSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlKGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2UoaXRlcmF0b3IpO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IHZhbHVlO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBUaGUgcmlnaHQtYXNzb2NpYXRpdmUgdmVyc2lvbiBvZiByZWR1Y2UsIGFsc28ga25vd24gYXMgYGZvbGRyYC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZVJpZ2h0YCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlUmlnaHQgJiYgb2JqLnJlZHVjZVJpZ2h0ID09PSBuYXRpdmVSZWR1Y2VSaWdodCkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvcik7XG4gICAgfVxuICAgIHZhciBsZW5ndGggPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggIT09ICtsZW5ndGgpIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaW5kZXggPSBrZXlzID8ga2V5c1stLWxlbmd0aF0gOiAtLWxlbmd0aDtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gb2JqW2luZGV4XTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCBvYmpbaW5kZXhdLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIGZpcnN0IHZhbHVlIHdoaWNoIHBhc3NlcyBhIHRydXRoIHRlc3QuIEFsaWFzZWQgYXMgYGRldGVjdGAuXG4gIF8uZmluZCA9IF8uZGV0ZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZUZpbHRlciAmJiBvYmouZmlsdGVyID09PSBuYXRpdmVGaWx0ZXIpIHJldHVybiBvYmouZmlsdGVyKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuICFwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgIH0sIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIGFsbCBvZiB0aGUgZWxlbWVudHMgbWF0Y2ggYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZXZlcnlgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYWxsYC5cbiAgXy5ldmVyeSA9IF8uYWxsID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgfHwgKHByZWRpY2F0ZSA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlRXZlcnkgJiYgb2JqLmV2ZXJ5ID09PSBuYXRpdmVFdmVyeSkgcmV0dXJuIG9iai5ldmVyeShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgZWxlbWVudCBpbiB0aGUgb2JqZWN0IG1hdGNoZXMgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgc29tZWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbnlgLlxuICB2YXIgYW55ID0gXy5zb21lID0gXy5hbnkgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHByZWRpY2F0ZSB8fCAocHJlZGljYXRlID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlU29tZSAmJiBvYmouc29tZSA9PT0gbmF0aXZlU29tZSkgcmV0dXJuIG9iai5zb21lKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHJlc3VsdCB8fCAocmVzdWx0ID0gcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgXy5wcm9wZXJ0eShrZXkpKTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgXy5tYXRjaGVzKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy5maW5kKG9iaiwgXy5tYXRjaGVzKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgb3IgKGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICAvLyBDYW4ndCBvcHRpbWl6ZSBhcnJheXMgb2YgaW50ZWdlcnMgbG9uZ2VyIHRoYW4gNjUsNTM1IGVsZW1lbnRzLlxuICAvLyBTZWUgW1dlYktpdCBCdWcgODA3OTddKGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MDc5NylcbiAgXy5tYXggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9IC1JbmZpbml0eSwgbGFzdENvbXB1dGVkID0gLUluZmluaXR5O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBpZiAoY29tcHV0ZWQgPiBsYXN0Q29tcHV0ZWQpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIGxhc3RDb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gSW5maW5pdHksIGxhc3RDb21wdXRlZCA9IEluZmluaXR5O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBpZiAoY29tcHV0ZWQgPCBsYXN0Q29tcHV0ZWQpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIGxhc3RDb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gU2h1ZmZsZSBhbiBhcnJheSwgdXNpbmcgdGhlIG1vZGVybiB2ZXJzaW9uIG9mIHRoZVxuICAvLyBbRmlzaGVyLVlhdGVzIHNodWZmbGVdKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmlzaGVy4oCTWWF0ZXNfc2h1ZmZsZSkuXG4gIF8uc2h1ZmZsZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByYW5kO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNodWZmbGVkID0gW107XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByYW5kID0gXy5yYW5kb20oaW5kZXgrKyk7XG4gICAgICBzaHVmZmxlZFtpbmRleCAtIDFdID0gc2h1ZmZsZWRbcmFuZF07XG4gICAgICBzaHVmZmxlZFtyYW5kXSA9IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiBzaHVmZmxlZDtcbiAgfTtcblxuICAvLyBTYW1wbGUgKipuKiogcmFuZG9tIHZhbHVlcyBmcm9tIGEgY29sbGVjdGlvbi5cbiAgLy8gSWYgKipuKiogaXMgbm90IHNwZWNpZmllZCwgcmV0dXJucyBhIHNpbmdsZSByYW5kb20gZWxlbWVudC5cbiAgLy8gVGhlIGludGVybmFsIGBndWFyZGAgYXJndW1lbnQgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgbWFwYC5cbiAgXy5zYW1wbGUgPSBmdW5jdGlvbihvYmosIG4sIGd1YXJkKSB7XG4gICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkge1xuICAgICAgaWYgKG9iai5sZW5ndGggIT09ICtvYmoubGVuZ3RoKSBvYmogPSBfLnZhbHVlcyhvYmopO1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBfLmlkZW50aXR5O1xuICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWUpKSByZXR1cm4gdmFsdWU7XG4gICAgcmV0dXJuIF8ucHJvcGVydHkodmFsdWUpO1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcihpdGVyYXRvcik7XG4gICAgcmV0dXJuIF8ucGx1Y2soXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICBjcml0ZXJpYTogaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpXG4gICAgICB9O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYTtcbiAgICAgIHZhciBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICBpZiAoYSAhPT0gYikge1xuICAgICAgICBpZiAoYSA+IGIgfHwgYSA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKGEgPCBiIHx8IGIgPT09IHZvaWQgMCkgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxlZnQuaW5kZXggLSByaWdodC5pbmRleDtcbiAgICB9KSwgJ3ZhbHVlJyk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdXNlZCBmb3IgYWdncmVnYXRlIFwiZ3JvdXAgYnlcIiBvcGVyYXRpb25zLlxuICB2YXIgZ3JvdXAgPSBmdW5jdGlvbihiZWhhdmlvcikge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICBpdGVyYXRvciA9IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBvYmopO1xuICAgICAgICBiZWhhdmlvcihyZXN1bHQsIGtleSwgdmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gR3JvdXBzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24uIFBhc3MgZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZVxuICAvLyB0byBncm91cCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGNyaXRlcmlvbi5cbiAgXy5ncm91cEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgXy5oYXMocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0ucHVzaCh2YWx1ZSkgOiByZXN1bHRba2V5XSA9IFt2YWx1ZV07XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICBfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSsrIDogcmVzdWx0W2tleV0gPSAxO1xuICB9KTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcihpdGVyYXRvcik7XG4gICAgdmFyIHZhbHVlID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmopO1xuICAgIHZhciBsb3cgPSAwLCBoaWdoID0gYXJyYXkubGVuZ3RoO1xuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICB2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+PiAxO1xuICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBhcnJheVttaWRdKSA8IHZhbHVlID8gbG93ID0gbWlkICsgMSA6IGhpZ2ggPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsb3c7XG4gIH07XG5cbiAgLy8gU2FmZWx5IGNyZWF0ZSBhIHJlYWwsIGxpdmUgYXJyYXkgZnJvbSBhbnl0aGluZyBpdGVyYWJsZS5cbiAgXy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFvYmopIHJldHVybiBbXTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHJldHVybiBzbGljZS5jYWxsKG9iaik7XG4gICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSByZXR1cm4gXy5tYXAob2JqLCBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gXy52YWx1ZXMob2JqKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiBhbiBvYmplY3QuXG4gIF8uc2l6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgPyBvYmoubGVuZ3RoIDogXy5rZXlzKG9iaikubGVuZ3RoO1xuICB9O1xuXG4gIC8vIEFycmF5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGZpcnN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgaGVhZGAgYW5kIGB0YWtlYC4gVGhlICoqZ3VhcmQqKiBjaGVja1xuICAvLyBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8uZmlyc3QgPSBfLmhlYWQgPSBfLnRha2UgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQpIHJldHVybiBhcnJheVswXTtcbiAgICBpZiAobiA8IDApIHJldHVybiBbXTtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gKChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQpIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgTWF0aC5tYXgoYXJyYXkubGVuZ3RoIC0gbiwgMCkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgdGFpbGAgYW5kIGBkcm9wYC5cbiAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgYW4gKipuKiogd2lsbCByZXR1cm5cbiAgLy8gdGhlIHJlc3QgTiB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqXG4gIC8vIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5yZXN0ID0gXy50YWlsID0gXy5kcm9wID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pO1xuICB9O1xuXG4gIC8vIFRyaW0gb3V0IGFsbCBmYWxzeSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgXy5jb21wYWN0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIF8uaWRlbnRpdHkpO1xuICB9O1xuXG4gIC8vIEludGVybmFsIGltcGxlbWVudGF0aW9uIG9mIGEgcmVjdXJzaXZlIGBmbGF0dGVuYCBmdW5jdGlvbi5cbiAgdmFyIGZsYXR0ZW4gPSBmdW5jdGlvbihpbnB1dCwgc2hhbGxvdywgb3V0cHV0KSB7XG4gICAgaWYgKHNoYWxsb3cgJiYgXy5ldmVyeShpbnB1dCwgXy5pc0FycmF5KSkge1xuICAgICAgcmV0dXJuIGNvbmNhdC5hcHBseShvdXRwdXQsIGlucHV0KTtcbiAgICB9XG4gICAgZWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmIChfLmlzQXJyYXkodmFsdWUpIHx8IF8uaXNBcmd1bWVudHModmFsdWUpKSB7XG4gICAgICAgIHNoYWxsb3cgPyBwdXNoLmFwcGx5KG91dHB1dCwgdmFsdWUpIDogZmxhdHRlbih2YWx1ZSwgc2hhbGxvdywgb3V0cHV0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHB1dC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIC8vIEZsYXR0ZW4gb3V0IGFuIGFycmF5LCBlaXRoZXIgcmVjdXJzaXZlbHkgKGJ5IGRlZmF1bHQpLCBvciBqdXN0IG9uZSBsZXZlbC5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgW10pO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHZlcnNpb24gb2YgdGhlIGFycmF5IHRoYXQgZG9lcyBub3QgY29udGFpbiB0aGUgc3BlY2lmaWVkIHZhbHVlKHMpLlxuICBfLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmRpZmZlcmVuY2UoYXJyYXksIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH07XG5cbiAgLy8gU3BsaXQgYW4gYXJyYXkgaW50byB0d28gYXJyYXlzOiBvbmUgd2hvc2UgZWxlbWVudHMgYWxsIHNhdGlzZnkgdGhlIGdpdmVuXG4gIC8vIHByZWRpY2F0ZSwgYW5kIG9uZSB3aG9zZSBlbGVtZW50cyBhbGwgZG8gbm90IHNhdGlzZnkgdGhlIHByZWRpY2F0ZS5cbiAgXy5wYXJ0aXRpb24gPSBmdW5jdGlvbihhcnJheSwgcHJlZGljYXRlKSB7XG4gICAgdmFyIHBhc3MgPSBbXSwgZmFpbCA9IFtdO1xuICAgIGVhY2goYXJyYXksIGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgIChwcmVkaWNhdGUoZWxlbSkgPyBwYXNzIDogZmFpbCkucHVzaChlbGVtKTtcbiAgICB9KTtcbiAgICByZXR1cm4gW3Bhc3MsIGZhaWxdO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYSBkdXBsaWNhdGUtZnJlZSB2ZXJzaW9uIG9mIHRoZSBhcnJheS4gSWYgdGhlIGFycmF5IGhhcyBhbHJlYWR5XG4gIC8vIGJlZW4gc29ydGVkLCB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIHVzaW5nIGEgZmFzdGVyIGFsZ29yaXRobS5cbiAgLy8gQWxpYXNlZCBhcyBgdW5pcXVlYC5cbiAgXy51bmlxID0gXy51bmlxdWUgPSBmdW5jdGlvbihhcnJheSwgaXNTb3J0ZWQsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpc1NvcnRlZCkpIHtcbiAgICAgIGNvbnRleHQgPSBpdGVyYXRvcjtcbiAgICAgIGl0ZXJhdG9yID0gaXNTb3J0ZWQ7XG4gICAgICBpc1NvcnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICB2YXIgaW5pdGlhbCA9IGl0ZXJhdG9yID8gXy5tYXAoYXJyYXksIGl0ZXJhdG9yLCBjb250ZXh0KSA6IGFycmF5O1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICBlYWNoKGluaXRpYWwsIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgaWYgKGlzU29ydGVkID8gKCFpbmRleCB8fCBzZWVuW3NlZW4ubGVuZ3RoIC0gMV0gIT09IHZhbHVlKSA6ICFfLmNvbnRhaW5zKHNlZW4sIHZhbHVlKSkge1xuICAgICAgICBzZWVuLnB1c2godmFsdWUpO1xuICAgICAgICByZXN1bHRzLnB1c2goYXJyYXlbaW5kZXhdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdGhlIHVuaW9uOiBlYWNoIGRpc3RpbmN0IGVsZW1lbnQgZnJvbSBhbGwgb2ZcbiAgLy8gdGhlIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8udW5pb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bmlxKF8uZmxhdHRlbihhcmd1bWVudHMsIHRydWUpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgZXZlcnkgaXRlbSBzaGFyZWQgYmV0d2VlbiBhbGwgdGhlXG4gIC8vIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoXy51bmlxKGFycmF5KSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIF8uZXZlcnkocmVzdCwgZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIF8uY29udGFpbnMob3RoZXIsIGl0ZW0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7IH0pO1xuICB9O1xuXG4gIC8vIFppcCB0b2dldGhlciBtdWx0aXBsZSBsaXN0cyBpbnRvIGEgc2luZ2xlIGFycmF5IC0tIGVsZW1lbnRzIHRoYXQgc2hhcmVcbiAgLy8gYW4gaW5kZXggZ28gdG9nZXRoZXIuXG4gIF8uemlwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxlbmd0aCA9IF8ubWF4KF8ucGx1Y2soYXJndW1lbnRzLCAnbGVuZ3RoJykuY29uY2F0KDApKTtcbiAgICB2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdHNbaV0gPSBfLnBsdWNrKGFyZ3VtZW50cywgJycgKyBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB7fTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBseSB1cyB3aXRoIGluZGV4T2YgKEknbSBsb29raW5nIGF0IHlvdSwgKipNU0lFKiopLFxuICAvLyB3ZSBuZWVkIHRoaXMgZnVuY3Rpb24uIFJldHVybiB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYW5cbiAgLy8gaXRlbSBpbiBhbiBhcnJheSwgb3IgLTEgaWYgdGhlIGl0ZW0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBhcnJheS5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgLy8gSWYgdGhlIGFycmF5IGlzIGxhcmdlIGFuZCBhbHJlYWR5IGluIHNvcnQgb3JkZXIsIHBhc3MgYHRydWVgXG4gIC8vIGZvciAqKmlzU29ydGVkKiogdG8gdXNlIGJpbmFyeSBzZWFyY2guXG4gIF8uaW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBpc1NvcnRlZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG4gICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICBpZiAodHlwZW9mIGlzU29ydGVkID09ICdudW1iZXInKSB7XG4gICAgICAgIGkgPSAoaXNTb3J0ZWQgPCAwID8gTWF0aC5tYXgoMCwgbGVuZ3RoICsgaXNTb3J0ZWQpIDogaXNTb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IF8uc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaV0gPT09IGl0ZW0gPyBpIDogLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIGFycmF5LmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBhcnJheS5pbmRleE9mKGl0ZW0sIGlzU29ydGVkKTtcbiAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbGFzdEluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgXy5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBmcm9tKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaGFzSW5kZXggPSBmcm9tICE9IG51bGw7XG4gICAgaWYgKG5hdGl2ZUxhc3RJbmRleE9mICYmIGFycmF5Lmxhc3RJbmRleE9mID09PSBuYXRpdmVMYXN0SW5kZXhPZikge1xuICAgICAgcmV0dXJuIGhhc0luZGV4ID8gYXJyYXkubGFzdEluZGV4T2YoaXRlbSwgZnJvbSkgOiBhcnJheS5sYXN0SW5kZXhPZihpdGVtKTtcbiAgICB9XG4gICAgdmFyIGkgPSAoaGFzSW5kZXggPyBmcm9tIDogYXJyYXkubGVuZ3RoKTtcbiAgICB3aGlsZSAoaS0tKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhbiBpbnRlZ2VyIEFycmF5IGNvbnRhaW5pbmcgYW4gYXJpdGhtZXRpYyBwcm9ncmVzc2lvbi4gQSBwb3J0IG9mXG4gIC8vIHRoZSBuYXRpdmUgUHl0aG9uIGByYW5nZSgpYCBmdW5jdGlvbi4gU2VlXG4gIC8vIFt0aGUgUHl0aG9uIGRvY3VtZW50YXRpb25dKGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS9mdW5jdGlvbnMuaHRtbCNyYW5nZSkuXG4gIF8ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICBzdGVwID0gYXJndW1lbnRzWzJdIHx8IDE7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xuICAgIHZhciBpZHggPSAwO1xuICAgIHZhciByYW5nZSA9IG5ldyBBcnJheShsZW5ndGgpO1xuXG4gICAgd2hpbGUoaWR4IDwgbGVuZ3RoKSB7XG4gICAgICByYW5nZVtpZHgrK10gPSBzdGFydDtcbiAgICAgIHN0YXJ0ICs9IHN0ZXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmdlO1xuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIChhaGVtKSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV1c2FibGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHByb3RvdHlwZSBzZXR0aW5nLlxuICB2YXIgY3RvciA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICB2YXIgYXJncywgYm91bmQ7XG4gICAgaWYgKG5hdGl2ZUJpbmQgJiYgZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGlmICghXy5pc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgYm91bmQpKSByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgc2VsZiA9IG5ldyBjdG9yO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBudWxsO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC4gXyBhY3RzXG4gIC8vIGFzIGEgcGxhY2Vob2xkZXIsIGFsbG93aW5nIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgdG8gYmUgcHJlLWZpbGxlZC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBib3VuZEFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBvc2l0aW9uID0gMDtcbiAgICAgIHZhciBhcmdzID0gYm91bmRBcmdzLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gYXJncy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYXJnc1tpXSA9PT0gXykgYXJnc1tpXSA9IGFyZ3VtZW50c1twb3NpdGlvbisrXTtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChwb3NpdGlvbiA8IGFyZ3VtZW50cy5sZW5ndGgpIGFyZ3MucHVzaChhcmd1bWVudHNbcG9zaXRpb24rK10pO1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBCaW5kIGEgbnVtYmVyIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFJlbWFpbmluZyBhcmd1bWVudHNcbiAgLy8gYXJlIHRoZSBtZXRob2QgbmFtZXMgdG8gYmUgYm91bmQuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdCBhbGwgY2FsbGJhY2tzXG4gIC8vIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcignYmluZEFsbCBtdXN0IGJlIHBhc3NlZCBmdW5jdGlvbiBuYW1lcycpO1xuICAgIGVhY2goZnVuY3MsIGZ1bmN0aW9uKGYpIHsgb2JqW2ZdID0gXy5iaW5kKG9ialtmXSwgb2JqKTsgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBNZW1vaXplIGFuIGV4cGVuc2l2ZSBmdW5jdGlvbiBieSBzdG9yaW5nIGl0cyByZXN1bHRzLlxuICBfLm1lbW9pemUgPSBmdW5jdGlvbihmdW5jLCBoYXNoZXIpIHtcbiAgICB2YXIgbWVtbyA9IHt9O1xuICAgIGhhc2hlciB8fCAoaGFzaGVyID0gXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGtleSA9IGhhc2hlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIF8uaGFzKG1lbW8sIGtleSkgPyBtZW1vW2tleV0gOiAobWVtb1trZXldID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIERlbGF5cyBhIGZ1bmN0aW9uIGZvciB0aGUgZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcywgYW5kIHRoZW4gY2FsbHNcbiAgLy8gaXQgd2l0aCB0aGUgYXJndW1lbnRzIHN1cHBsaWVkLlxuICBfLmRlbGF5ID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGFyZ3MpOyB9LCB3YWl0KTtcbiAgfTtcblxuICAvLyBEZWZlcnMgYSBmdW5jdGlvbiwgc2NoZWR1bGluZyBpdCB0byBydW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXNcbiAgLy8gY2xlYXJlZC5cbiAgXy5kZWZlciA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICByZXR1cm4gXy5kZWxheS5hcHBseShfLCBbZnVuYywgMV0uY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgd2hlbiBpbnZva2VkLCB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGF0IG1vc3Qgb25jZVxuICAvLyBkdXJpbmcgYSBnaXZlbiB3aW5kb3cgb2YgdGltZS4gTm9ybWFsbHksIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbCBydW5cbiAgLy8gYXMgbXVjaCBhcyBpdCBjYW4sIHdpdGhvdXQgZXZlciBnb2luZyBtb3JlIHRoYW4gb25jZSBwZXIgYHdhaXRgIGR1cmF0aW9uO1xuICAvLyBidXQgaWYgeW91J2QgbGlrZSB0byBkaXNhYmxlIHRoZSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSwgcGFzc1xuICAvLyBge2xlYWRpbmc6IGZhbHNlfWAuIFRvIGRpc2FibGUgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlLCBkaXR0by5cbiAgXy50aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGV4dCwgYXJncywgcmVzdWx0O1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogXy5ub3coKTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBfLm5vdygpO1xuICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgfSBlbHNlIGlmICghdGltZW91dCAmJiBvcHRpb25zLnRyYWlsaW5nICE9PSBmYWxzZSkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gIC8vIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAgLy8gTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gIC8vIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gIF8uZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG5cbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsYXN0ID0gXy5ub3coKSAtIHRpbWVzdGFtcDtcbiAgICAgIGlmIChsYXN0IDwgd2FpdCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIGlmICghaW1tZWRpYXRlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdGltZXN0YW1wID0gXy5ub3coKTtcbiAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIH1cbiAgICAgIGlmIChjYWxsTm93KSB7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIHJhbiA9IGZhbHNlLCBtZW1vO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBmdW5jID0gbnVsbDtcbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3QgZnVuY3Rpb24gcGFzc2VkIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSBzZWNvbmQsXG4gIC8vIGFsbG93aW5nIHlvdSB0byBhZGp1c3QgYXJndW1lbnRzLCBydW4gY29kZSBiZWZvcmUgYW5kIGFmdGVyLCBhbmRcbiAgLy8gY29uZGl0aW9uYWxseSBleGVjdXRlIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cbiAgXy53cmFwID0gZnVuY3Rpb24oZnVuYywgd3JhcHBlcikge1xuICAgIHJldHVybiBfLnBhcnRpYWwod3JhcHBlciwgZnVuYyk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgaXMgdGhlIGNvbXBvc2l0aW9uIG9mIGEgbGlzdCBvZiBmdW5jdGlvbnMsIGVhY2hcbiAgLy8gY29uc3VtaW5nIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uIHRoYXQgZm9sbG93cy5cbiAgXy5jb21wb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZ1bmNzID0gYXJndW1lbnRzO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgZm9yICh2YXIgaSA9IGZ1bmNzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGFyZ3MgPSBbZnVuY3NbaV0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFyZ3NbMF07XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgYWZ0ZXIgYmVpbmcgY2FsbGVkIE4gdGltZXMuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gT2JqZWN0IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV0cmlldmUgdGhlIG5hbWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBPYmplY3Qua2V5c2BcbiAgXy5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBbXTtcbiAgICBpZiAobmF0aXZlS2V5cykgcmV0dXJuIG5hdGl2ZUtleXMob2JqKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIHRoZSB2YWx1ZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgXy52YWx1ZXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgdmFsdWVzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzW2ldID0gb2JqW2tleXNbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHBhaXJzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcGFpcnNbaV0gPSBba2V5c1tpXSwgb2JqW2tleXNbaV1dXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhaXJzO1xuICB9O1xuXG4gIC8vIEludmVydCB0aGUga2V5cyBhbmQgdmFsdWVzIG9mIGFuIG9iamVjdC4gVGhlIHZhbHVlcyBtdXN0IGJlIHNlcmlhbGl6YWJsZS5cbiAgXy5pbnZlcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0W29ialtrZXlzW2ldXV0gPSBrZXlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHNvcnRlZCBsaXN0IG9mIHRoZSBmdW5jdGlvbiBuYW1lcyBhdmFpbGFibGUgb24gdGhlIG9iamVjdC5cbiAgLy8gQWxpYXNlZCBhcyBgbWV0aG9kc2BcbiAgXy5mdW5jdGlvbnMgPSBfLm1ldGhvZHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9ialtrZXldKSkgbmFtZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXMuc29ydCgpO1xuICB9O1xuXG4gIC8vIEV4dGVuZCBhIGdpdmVuIG9iamVjdCB3aXRoIGFsbCB0aGUgcHJvcGVydGllcyBpbiBwYXNzZWQtaW4gb2JqZWN0KHMpLlxuICBfLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBlYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSBpbiBvYmopIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH0pO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgd2l0aG91dCB0aGUgYmxhY2tsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5vbWl0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmICghXy5jb250YWlucyhrZXlzLCBrZXkpKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgLy8gRmlsbCBpbiBhIGdpdmVuIG9iamVjdCB3aXRoIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgXy5kZWZhdWx0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBpZiAob2JqW3Byb3BdID09PSB2b2lkIDApIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgKHNoYWxsb3ctY2xvbmVkKSBkdXBsaWNhdGUgb2YgYW4gb2JqZWN0LlxuICBfLmNsb25lID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIF8uaXNBcnJheShvYmopID8gb2JqLnNsaWNlKCkgOiBfLmV4dGVuZCh7fSwgb2JqKTtcbiAgfTtcblxuICAvLyBJbnZva2VzIGludGVyY2VwdG9yIHdpdGggdGhlIG9iaiwgYW5kIHRoZW4gcmV0dXJucyBvYmouXG4gIC8vIFRoZSBwcmltYXJ5IHB1cnBvc2Ugb2YgdGhpcyBtZXRob2QgaXMgdG8gXCJ0YXAgaW50b1wiIGEgbWV0aG9kIGNoYWluLCBpblxuICAvLyBvcmRlciB0byBwZXJmb3JtIG9wZXJhdGlvbnMgb24gaW50ZXJtZWRpYXRlIHJlc3VsdHMgd2l0aGluIHRoZSBjaGFpbi5cbiAgXy50YXAgPSBmdW5jdGlvbihvYmosIGludGVyY2VwdG9yKSB7XG4gICAgaW50ZXJjZXB0b3Iob2JqKTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIEludGVybmFsIHJlY3Vyc2l2ZSBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBgaXNFcXVhbGAuXG4gIHZhciBlcSA9IGZ1bmN0aW9uKGEsIGIsIGFTdGFjaywgYlN0YWNrKSB7XG4gICAgLy8gSWRlbnRpY2FsIG9iamVjdHMgYXJlIGVxdWFsLiBgMCA9PT0gLTBgLCBidXQgdGhleSBhcmVuJ3QgaWRlbnRpY2FsLlxuICAgIC8vIFNlZSB0aGUgW0hhcm1vbnkgYGVnYWxgIHByb3Bvc2FsXShodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmVnYWwpLlxuICAgIGlmIChhID09PSBiKSByZXR1cm4gYSAhPT0gMCB8fCAxIC8gYSA9PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuIGEgPT0gU3RyaW5nKGIpO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS4gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvclxuICAgICAgICAvLyBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuIGEgIT0gK2EgPyBiICE9ICtiIDogKGEgPT0gMCA/IDEgLyBhID09IDEgLyBiIDogYSA9PSArYik7XG4gICAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWVyaWMgcHJpbWl0aXZlIHZhbHVlcy4gRGF0ZXMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyXG4gICAgICAgIC8vIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9ucy4gTm90ZSB0aGF0IGludmFsaWQgZGF0ZXMgd2l0aCBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnNcbiAgICAgICAgLy8gb2YgYE5hTmAgYXJlIG5vdCBlcXVpdmFsZW50LlxuICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb21wYXJlZCBieSB0aGVpciBzb3VyY2UgcGF0dGVybnMgYW5kIGZsYWdzLlxuICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgICAgcmV0dXJuIGEuc291cmNlID09IGIuc291cmNlICYmXG4gICAgICAgICAgICAgICBhLmdsb2JhbCA9PSBiLmdsb2JhbCAmJlxuICAgICAgICAgICAgICAgYS5tdWx0aWxpbmUgPT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgICAgIGEuaWdub3JlQ2FzZSA9PSBiLmlnbm9yZUNhc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPSAnb2JqZWN0JyB8fCB0eXBlb2YgYiAhPSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PSBiO1xuICAgIH1cbiAgICAvLyBPYmplY3RzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWl2YWxlbnQsIGJ1dCBgT2JqZWN0YHNcbiAgICAvLyBmcm9tIGRpZmZlcmVudCBmcmFtZXMgYXJlLlxuICAgIHZhciBhQ3RvciA9IGEuY29uc3RydWN0b3IsIGJDdG9yID0gYi5jb25zdHJ1Y3RvcjtcbiAgICBpZiAoYUN0b3IgIT09IGJDdG9yICYmICEoXy5pc0Z1bmN0aW9uKGFDdG9yKSAmJiAoYUN0b3IgaW5zdGFuY2VvZiBhQ3RvcikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiAoYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcikpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAoJ2NvbnN0cnVjdG9yJyBpbiBhICYmICdjb25zdHJ1Y3RvcicgaW4gYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSBmaXJzdCBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wdXNoKGEpO1xuICAgIGJTdGFjay5wdXNoKGIpO1xuICAgIHZhciBzaXplID0gMCwgcmVzdWx0ID0gdHJ1ZTtcbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICBpZiAoY2xhc3NOYW1lID09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgIC8vIENvbXBhcmUgYXJyYXkgbGVuZ3RocyB0byBkZXRlcm1pbmUgaWYgYSBkZWVwIGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5LlxuICAgICAgc2l6ZSA9IGEubGVuZ3RoO1xuICAgICAgcmVzdWx0ID0gc2l6ZSA9PSBiLmxlbmd0aDtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgLy8gRGVlcCBjb21wYXJlIHRoZSBjb250ZW50cywgaWdub3Jpbmcgbm9uLW51bWVyaWMgcHJvcGVydGllcy5cbiAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgIGlmICghKHJlc3VsdCA9IGVxKGFbc2l6ZV0sIGJbc2l6ZV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIERlZXAgY29tcGFyZSBvYmplY3RzLlxuICAgICAgZm9yICh2YXIga2V5IGluIGEpIHtcbiAgICAgICAgaWYgKF8uaGFzKGEsIGtleSkpIHtcbiAgICAgICAgICAvLyBDb3VudCB0aGUgZXhwZWN0ZWQgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlci5cbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBfLmhhcyhiLCBrZXkpICYmIGVxKGFba2V5XSwgYltrZXldLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGZvciAoa2V5IGluIGIpIHtcbiAgICAgICAgICBpZiAoXy5oYXMoYiwga2V5KSAmJiAhKHNpemUtLSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9ICFzaXplO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IG9iamVjdCBmcm9tIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucG9wKCk7XG4gICAgYlN0YWNrLnBvcCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUGVyZm9ybSBhIGRlZXAgY29tcGFyaXNvbiB0byBjaGVjayBpZiB0d28gb2JqZWN0cyBhcmUgZXF1YWwuXG4gIF8uaXNFcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gZXEoYSwgYiwgW10sIFtdKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIGFycmF5LCBzdHJpbmcsIG9yIG9iamVjdCBlbXB0eT9cbiAgLy8gQW4gXCJlbXB0eVwiIG9iamVjdCBoYXMgbm8gZW51bWVyYWJsZSBvd24tcHJvcGVydGllcy5cbiAgXy5pc0VtcHR5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc1N0cmluZyhvYmopKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIERPTSBlbGVtZW50P1xuICBfLmlzRWxlbWVudCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGFuIGFycmF5P1xuICAvLyBEZWxlZ2F0ZXMgdG8gRUNNQTUncyBuYXRpdmUgQXJyYXkuaXNBcnJheVxuICBfLmlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIGFuIG9iamVjdD9cbiAgXy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICB9O1xuXG4gIC8vIEFkZCBzb21lIGlzVHlwZSBtZXRob2RzOiBpc0FyZ3VtZW50cywgaXNGdW5jdGlvbiwgaXNTdHJpbmcsIGlzTnVtYmVyLCBpc0RhdGUsIGlzUmVnRXhwLlxuICBlYWNoKFsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIF9bJ2lzJyArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0ICcgKyBuYW1lICsgJ10nO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIERlZmluZSBhIGZhbGxiYWNrIHZlcnNpb24gb2YgdGhlIG1ldGhvZCBpbiBicm93c2VycyAoYWhlbSwgSUUpLCB3aGVyZVxuICAvLyB0aGVyZSBpc24ndCBhbnkgaW5zcGVjdGFibGUgXCJBcmd1bWVudHNcIiB0eXBlLlxuICBpZiAoIV8uaXNBcmd1bWVudHMoYXJndW1lbnRzKSkge1xuICAgIF8uaXNBcmd1bWVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAhIShvYmogJiYgXy5oYXMob2JqLCAnY2FsbGVlJykpO1xuICAgIH07XG4gIH1cblxuICAvLyBPcHRpbWl6ZSBgaXNGdW5jdGlvbmAgaWYgYXBwcm9wcmlhdGUuXG4gIGlmICh0eXBlb2YgKC8uLykgIT09ICdmdW5jdGlvbicpIHtcbiAgICBfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xuICAgIH07XG4gIH1cblxuICAvLyBJcyBhIGdpdmVuIG9iamVjdCBhIGZpbml0ZSBudW1iZXI/XG4gIF8uaXNGaW5pdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gaXNGaW5pdGUob2JqKSAmJiAhaXNOYU4ocGFyc2VGbG9hdChvYmopKTtcbiAgfTtcblxuICAvLyBJcyB0aGUgZ2l2ZW4gdmFsdWUgYE5hTmA/IChOYU4gaXMgdGhlIG9ubHkgbnVtYmVyIHdoaWNoIGRvZXMgbm90IGVxdWFsIGl0c2VsZikuXG4gIF8uaXNOYU4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXy5pc051bWJlcihvYmopICYmIG9iaiAhPSArb2JqO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBib29sZWFuP1xuICBfLmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdG9ycy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIF8uY29uc3RhbnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgfTtcblxuICBfLnByb3BlcnR5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIHByZWRpY2F0ZSBmb3IgY2hlY2tpbmcgd2hldGhlciBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gc2V0IG9mIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLm1hdGNoZXMgPSBmdW5jdGlvbihhdHRycykge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIGlmIChvYmogPT09IGF0dHJzKSByZXR1cm4gdHJ1ZTsgLy9hdm9pZCBjb21wYXJpbmcgYW4gb2JqZWN0IHRvIGl0c2VsZi5cbiAgICAgIGZvciAodmFyIGtleSBpbiBhdHRycykge1xuICAgICAgICBpZiAoYXR0cnNba2V5XSAhPT0gb2JqW2tleV0pXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9O1xuXG4gIC8vIFJ1biBhIGZ1bmN0aW9uICoqbioqIHRpbWVzLlxuICBfLnRpbWVzID0gZnVuY3Rpb24obiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgYWNjdW0gPSBBcnJheShNYXRoLm1heCgwLCBuKSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIGFjY3VtW2ldID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVzaXZlKS5cbiAgXy5yYW5kb20gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gbWluO1xuICAgICAgbWluID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gIH07XG5cbiAgLy8gQSAocG9zc2libHkgZmFzdGVyKSB3YXkgdG8gZ2V0IHRoZSBjdXJyZW50IHRpbWVzdGFtcCBhcyBhbiBpbnRlZ2VyLlxuICBfLm5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgLy8gTGlzdCBvZiBIVE1MIGVudGl0aWVzIGZvciBlc2NhcGluZy5cbiAgdmFyIGVudGl0eU1hcCA9IHtcbiAgICBlc2NhcGU6IHtcbiAgICAgICcmJzogJyZhbXA7JyxcbiAgICAgICc8JzogJyZsdDsnLFxuICAgICAgJz4nOiAnJmd0OycsXG4gICAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICAgIFwiJ1wiOiAnJiN4Mjc7J1xuICAgIH1cbiAgfTtcbiAgZW50aXR5TWFwLnVuZXNjYXBlID0gXy5pbnZlcnQoZW50aXR5TWFwLmVzY2FwZSk7XG5cbiAgLy8gUmVnZXhlcyBjb250YWluaW5nIHRoZSBrZXlzIGFuZCB2YWx1ZXMgbGlzdGVkIGltbWVkaWF0ZWx5IGFib3ZlLlxuICB2YXIgZW50aXR5UmVnZXhlcyA9IHtcbiAgICBlc2NhcGU6ICAgbmV3IFJlZ0V4cCgnWycgKyBfLmtleXMoZW50aXR5TWFwLmVzY2FwZSkuam9pbignJykgKyAnXScsICdnJyksXG4gICAgdW5lc2NhcGU6IG5ldyBSZWdFeHAoJygnICsgXy5rZXlzKGVudGl0eU1hcC51bmVzY2FwZSkuam9pbignfCcpICsgJyknLCAnZycpXG4gIH07XG5cbiAgLy8gRnVuY3Rpb25zIGZvciBlc2NhcGluZyBhbmQgdW5lc2NhcGluZyBzdHJpbmdzIHRvL2Zyb20gSFRNTCBpbnRlcnBvbGF0aW9uLlxuICBfLmVhY2goWydlc2NhcGUnLCAndW5lc2NhcGUnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgX1ttZXRob2RdID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBpZiAoc3RyaW5nID09IG51bGwpIHJldHVybiAnJztcbiAgICAgIHJldHVybiAoJycgKyBzdHJpbmcpLnJlcGxhY2UoZW50aXR5UmVnZXhlc1ttZXRob2RdLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZW50aXR5TWFwW21ldGhvZF1bbWF0Y2hdO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gSWYgdGhlIHZhbHVlIG9mIHRoZSBuYW1lZCBgcHJvcGVydHlgIGlzIGEgZnVuY3Rpb24gdGhlbiBpbnZva2UgaXQgd2l0aCB0aGVcbiAgLy8gYG9iamVjdGAgYXMgY29udGV4dDsgb3RoZXJ3aXNlLCByZXR1cm4gaXQuXG4gIF8ucmVzdWx0ID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH07XG5cbiAgLy8gQWRkIHlvdXIgb3duIGN1c3RvbSBmdW5jdGlvbnMgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChfLmZ1bmN0aW9ucyhvYmopLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgZnVuYyA9IF9bbmFtZV0gPSBvYmpbbmFtZV07XG4gICAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IFt0aGlzLl93cmFwcGVkXTtcbiAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgZnVuYy5hcHBseShfLCBhcmdzKSk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGEgdW5pcXVlIGludGVnZXIgaWQgKHVuaXF1ZSB3aXRoaW4gdGhlIGVudGlyZSBjbGllbnQgc2Vzc2lvbikuXG4gIC8vIFVzZWZ1bCBmb3IgdGVtcG9yYXJ5IERPTSBpZHMuXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuICBfLnVuaXF1ZUlkID0gZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgfTtcblxuICAvLyBCeSBkZWZhdWx0LCBVbmRlcnNjb3JlIHVzZXMgRVJCLXN0eWxlIHRlbXBsYXRlIGRlbGltaXRlcnMsIGNoYW5nZSB0aGVcbiAgLy8gZm9sbG93aW5nIHRlbXBsYXRlIHNldHRpbmdzIHRvIHVzZSBhbHRlcm5hdGl2ZSBkZWxpbWl0ZXJzLlxuICBfLnRlbXBsYXRlU2V0dGluZ3MgPSB7XG4gICAgZXZhbHVhdGUgICAgOiAvPCUoW1xcc1xcU10rPyklPi9nLFxuICAgIGludGVycG9sYXRlIDogLzwlPShbXFxzXFxTXSs/KSU+L2csXG4gICAgZXNjYXBlICAgICAgOiAvPCUtKFtcXHNcXFNdKz8pJT4vZ1xuICB9O1xuXG4gIC8vIFdoZW4gY3VzdG9taXppbmcgYHRlbXBsYXRlU2V0dGluZ3NgLCBpZiB5b3UgZG9uJ3Qgd2FudCB0byBkZWZpbmUgYW5cbiAgLy8gaW50ZXJwb2xhdGlvbiwgZXZhbHVhdGlvbiBvciBlc2NhcGluZyByZWdleCwgd2UgbmVlZCBvbmUgdGhhdCBpc1xuICAvLyBndWFyYW50ZWVkIG5vdCB0byBtYXRjaC5cbiAgdmFyIG5vTWF0Y2ggPSAvKC4pXi87XG5cbiAgLy8gQ2VydGFpbiBjaGFyYWN0ZXJzIG5lZWQgdG8gYmUgZXNjYXBlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHB1dCBpbnRvIGFcbiAgLy8gc3RyaW5nIGxpdGVyYWwuXG4gIHZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx0JzogICAgICd0JyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG4gIH07XG5cbiAgdmFyIGVzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx0fFxcdTIwMjh8XFx1MjAyOS9nO1xuXG4gIC8vIEphdmFTY3JpcHQgbWljcm8tdGVtcGxhdGluZywgc2ltaWxhciB0byBKb2huIFJlc2lnJ3MgaW1wbGVtZW50YXRpb24uXG4gIC8vIFVuZGVyc2NvcmUgdGVtcGxhdGluZyBoYW5kbGVzIGFyYml0cmFyeSBkZWxpbWl0ZXJzLCBwcmVzZXJ2ZXMgd2hpdGVzcGFjZSxcbiAgLy8gYW5kIGNvcnJlY3RseSBlc2NhcGVzIHF1b3RlcyB3aXRoaW4gaW50ZXJwb2xhdGVkIGNvZGUuXG4gIF8udGVtcGxhdGUgPSBmdW5jdGlvbih0ZXh0LCBkYXRhLCBzZXR0aW5ncykge1xuICAgIHZhciByZW5kZXI7XG4gICAgc2V0dGluZ3MgPSBfLmRlZmF1bHRzKHt9LCBzZXR0aW5ncywgXy50ZW1wbGF0ZVNldHRpbmdzKTtcblxuICAgIC8vIENvbWJpbmUgZGVsaW1pdGVycyBpbnRvIG9uZSByZWd1bGFyIGV4cHJlc3Npb24gdmlhIGFsdGVybmF0aW9uLlxuICAgIHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChbXG4gICAgICAoc2V0dGluZ3MuZXNjYXBlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5pbnRlcnBvbGF0ZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgdGVtcGxhdGUgc291cmNlLCBlc2NhcGluZyBzdHJpbmcgbGl0ZXJhbHMgYXBwcm9wcmlhdGVseS5cbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzb3VyY2UgPSBcIl9fcCs9J1wiO1xuICAgIHRleHQucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbihtYXRjaCwgZXNjYXBlLCBpbnRlcnBvbGF0ZSwgZXZhbHVhdGUsIG9mZnNldCkge1xuICAgICAgc291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldClcbiAgICAgICAgLnJlcGxhY2UoZXNjYXBlciwgZnVuY3Rpb24obWF0Y2gpIHsgcmV0dXJuICdcXFxcJyArIGVzY2FwZXNbbWF0Y2hdOyB9KTtcblxuICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGVzY2FwZSArIFwiKSk9PW51bGw/Jyc6Xy5lc2NhcGUoX190KSkrXFxuJ1wiO1xuICAgICAgfVxuICAgICAgaWYgKGludGVycG9sYXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgaW50ZXJwb2xhdGUgKyBcIikpPT1udWxsPycnOl9fdCkrXFxuJ1wiO1xuICAgICAgfVxuICAgICAgaWYgKGV2YWx1YXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG4gICAgICB9XG4gICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcbiAgICBzb3VyY2UgKz0gXCInO1xcblwiO1xuXG4gICAgLy8gSWYgYSB2YXJpYWJsZSBpcyBub3Qgc3BlY2lmaWVkLCBwbGFjZSBkYXRhIHZhbHVlcyBpbiBsb2NhbCBzY29wZS5cbiAgICBpZiAoIXNldHRpbmdzLnZhcmlhYmxlKSBzb3VyY2UgPSAnd2l0aChvYmp8fHt9KXtcXG4nICsgc291cmNlICsgJ31cXG4nO1xuXG4gICAgc291cmNlID0gXCJ2YXIgX190LF9fcD0nJyxfX2o9QXJyYXkucHJvdG90eXBlLmpvaW4sXCIgK1xuICAgICAgXCJwcmludD1mdW5jdGlvbigpe19fcCs9X19qLmNhbGwoYXJndW1lbnRzLCcnKTt9O1xcblwiICtcbiAgICAgIHNvdXJjZSArIFwicmV0dXJuIF9fcDtcXG5cIjtcblxuICAgIHRyeSB7XG4gICAgICByZW5kZXIgPSBuZXcgRnVuY3Rpb24oc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicsICdfJywgc291cmNlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEpIHJldHVybiByZW5kZXIoZGF0YSwgXyk7XG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIHJlbmRlci5jYWxsKHRoaXMsIGRhdGEsIF8pO1xuICAgIH07XG5cbiAgICAvLyBQcm92aWRlIHRoZSBjb21waWxlZCBmdW5jdGlvbiBzb3VyY2UgYXMgYSBjb252ZW5pZW5jZSBmb3IgcHJlY29tcGlsYXRpb24uXG4gICAgdGVtcGxhdGUuc291cmNlID0gJ2Z1bmN0aW9uKCcgKyAoc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicpICsgJyl7XFxuJyArIHNvdXJjZSArICd9JztcblxuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfTtcblxuICAvLyBBZGQgYSBcImNoYWluXCIgZnVuY3Rpb24sIHdoaWNoIHdpbGwgZGVsZWdhdGUgdG8gdGhlIHdyYXBwZXIuXG4gIF8uY2hhaW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXyhvYmopLmNoYWluKCk7XG4gIH07XG5cbiAgLy8gT09QXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAvLyBJZiBVbmRlcnNjb3JlIGlzIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLCBpdCByZXR1cm5zIGEgd3JhcHBlZCBvYmplY3QgdGhhdFxuICAvLyBjYW4gYmUgdXNlZCBPTy1zdHlsZS4gVGhpcyB3cmFwcGVyIGhvbGRzIGFsdGVyZWQgdmVyc2lvbnMgb2YgYWxsIHRoZVxuICAvLyB1bmRlcnNjb3JlIGZ1bmN0aW9ucy4gV3JhcHBlZCBvYmplY3RzIG1heSBiZSBjaGFpbmVkLlxuXG4gIC8vIEhlbHBlciBmdW5jdGlvbiB0byBjb250aW51ZSBjaGFpbmluZyBpbnRlcm1lZGlhdGUgcmVzdWx0cy5cbiAgdmFyIHJlc3VsdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0aGlzLl9jaGFpbiA/IF8ob2JqKS5jaGFpbigpIDogb2JqO1xuICB9O1xuXG4gIC8vIEFkZCBhbGwgb2YgdGhlIFVuZGVyc2NvcmUgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyIG9iamVjdC5cbiAgXy5taXhpbihfKTtcblxuICAvLyBBZGQgYWxsIG11dGF0b3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBlYWNoKFsncG9wJywgJ3B1c2gnLCAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXMuX3dyYXBwZWQ7XG4gICAgICBtZXRob2QuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKChuYW1lID09ICdzaGlmdCcgfHwgbmFtZSA9PSAnc3BsaWNlJykgJiYgb2JqLmxlbmd0aCA9PT0gMCkgZGVsZXRlIG9ialswXTtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBvYmopO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFkZCBhbGwgYWNjZXNzb3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBlYWNoKFsnY29uY2F0JywgJ2pvaW4nLCAnc2xpY2UnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgbWV0aG9kLmFwcGx5KHRoaXMuX3dyYXBwZWQsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH0pO1xuXG4gIF8uZXh0ZW5kKF8ucHJvdG90eXBlLCB7XG5cbiAgICAvLyBTdGFydCBjaGFpbmluZyBhIHdyYXBwZWQgVW5kZXJzY29yZSBvYmplY3QuXG4gICAgY2hhaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY2hhaW4gPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEV4dHJhY3RzIHRoZSByZXN1bHQgZnJvbSBhIHdyYXBwZWQgYW5kIGNoYWluZWQgb2JqZWN0LlxuICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl93cmFwcGVkO1xuICAgIH1cblxuICB9KTtcblxuICAvLyBBTUQgcmVnaXN0cmF0aW9uIGhhcHBlbnMgYXQgdGhlIGVuZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIEFNRCBsb2FkZXJzXG4gIC8vIHRoYXQgbWF5IG5vdCBlbmZvcmNlIG5leHQtdHVybiBzZW1hbnRpY3Mgb24gbW9kdWxlcy4gRXZlbiB0aG91Z2ggZ2VuZXJhbFxuICAvLyBwcmFjdGljZSBmb3IgQU1EIHJlZ2lzdHJhdGlvbiBpcyB0byBiZSBhbm9ueW1vdXMsIHVuZGVyc2NvcmUgcmVnaXN0ZXJzXG4gIC8vIGFzIGEgbmFtZWQgbW9kdWxlIGJlY2F1c2UsIGxpa2UgalF1ZXJ5LCBpdCBpcyBhIGJhc2UgbGlicmFyeSB0aGF0IGlzXG4gIC8vIHBvcHVsYXIgZW5vdWdoIHRvIGJlIGJ1bmRsZWQgaW4gYSB0aGlyZCBwYXJ0eSBsaWIsIGJ1dCBub3QgYmUgcGFydCBvZlxuICAvLyBhbiBBTUQgbG9hZCByZXF1ZXN0LiBUaG9zZSBjYXNlcyBjb3VsZCBnZW5lcmF0ZSBhbiBlcnJvciB3aGVuIGFuXG4gIC8vIGFub255bW91cyBkZWZpbmUoKSBpcyBjYWxsZWQgb3V0c2lkZSBvZiBhIGxvYWRlciByZXF1ZXN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCd1bmRlcnNjb3JlJywgW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF87XG4gICAgfSk7XG4gIH1cbn0pLmNhbGwodGhpcyk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHQ7XG5cblxuXG5mdW5jdGlvbiBDb250ZXh0KF9ib3VuZHMsIF9tYXRyaXgpIHtcblx0dGhpcy5ib3VuZHMgPSBfYm91bmRzID8gX2JvdW5kcy5jbG9uZSgpIDogbmV3IHBhcGVyLlJlY3RhbmdsZSgwLCAwLCAwLCAwKTtcblx0dGhpcy5tYXRyaXggPSBfbWF0cml4ID8gX21hdHJpeC5jbG9uZSgpIDogbmV3IHBhcGVyLk1hdHJpeCgpO1xufVxuXG5Db250ZXh0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gXCJDb250ZXh0OiBcIiArIHRoaXMuYm91bmRzO1xufTtcblxuXG5Db250ZXh0LnByb3RvdHlwZS5kZXJpdmVDb250ZXh0ID0gZnVuY3Rpb24oX3Byb3BlcnRpZXMpIHtcblxuXHQvLyBDYWxjdWxhdGUgQm91bmRzXG5cdHZhciBkZXJpdmVkQm91bmRzID0gbmV3IHBhcGVyLlJlY3RhbmdsZSgpO1xuXG5cdGRlcml2ZWRCb3VuZHMudG9wID0gZGVyaXZlQm91bmQoXG5cdFx0dGhpcy5ib3VuZHMudG9wLCB0aGlzLmJvdW5kcy5ib3R0b20sXG5cdFx0X3Byb3BlcnRpZXMudG9wLCBfcHJvcGVydGllcy5tYXJnaW5fdG9wLCBfcHJvcGVydGllcy5ib3R0b20sIF9wcm9wZXJ0aWVzLm1hcmdpbl9ib3R0b20sIF9wcm9wZXJ0aWVzLmhlaWdodCwgLTFcblx0KTtcblxuXHRkZXJpdmVkQm91bmRzLmJvdHRvbSA9IGRlcml2ZUJvdW5kKFxuXHRcdHRoaXMuYm91bmRzLmJvdHRvbSwgdGhpcy5ib3VuZHMudG9wLFxuXHRcdF9wcm9wZXJ0aWVzLmJvdHRvbSwgX3Byb3BlcnRpZXMubWFyZ2luX2JvdHRvbSwgX3Byb3BlcnRpZXMudG9wLCBfcHJvcGVydGllcy5tYXJnaW5fdG9wLCBfcHJvcGVydGllcy5oZWlnaHQsIDFcblx0KTtcblxuXHRkZXJpdmVkQm91bmRzLmxlZnQgPSBkZXJpdmVCb3VuZChcblx0XHR0aGlzLmJvdW5kcy5sZWZ0LCB0aGlzLmJvdW5kcy5yaWdodCxcblx0XHRfcHJvcGVydGllcy5sZWZ0LCBfcHJvcGVydGllcy5tYXJnaW5fbGVmdCwgX3Byb3BlcnRpZXMucmlnaHQsIF9wcm9wZXJ0aWVzLm1hcmdpbl9yaWdodCwgX3Byb3BlcnRpZXMud2lkdGgsIC0xXG5cdCk7XG5cblx0ZGVyaXZlZEJvdW5kcy5yaWdodCA9IGRlcml2ZUJvdW5kKFxuXHRcdHRoaXMuYm91bmRzLnJpZ2h0LCB0aGlzLmJvdW5kcy5sZWZ0LFxuXHRcdF9wcm9wZXJ0aWVzLnJpZ2h0LCBfcHJvcGVydGllcy5tYXJnaW5fcmlnaHQsIF9wcm9wZXJ0aWVzLmxlZnQsIF9wcm9wZXJ0aWVzLm1hcmdpbl9sZWZ0LCBfcHJvcGVydGllcy53aWR0aCwgMVxuXHQpO1xuXG5cblxuXHQvLyBDYWxjdWxhdGUgTWF0cml4XG5cdHZhciBkZXJpdmVkTWF0cml4ID0gdGhpcy5tYXRyaXguY2xvbmUoKTtcblx0dmFyIGRlcml2ZWRDb250ZXh0ID0gbmV3IENvbnRleHQoZGVyaXZlZEJvdW5kcywgZGVyaXZlZE1hdHJpeCk7XG5cblx0aWYgKF9wcm9wZXJ0aWVzLnJlZ2lzdHJhdGlvbiA9PT0gXCJjZW50ZXJcIikge1xuXHRcdGRlcml2ZWRDb250ZXh0Lm1vdmVSZWdpc3RyYXRpb24oZGVyaXZlZENvbnRleHQuYm91bmRzLmNlbnRlci54LCBkZXJpdmVkQ29udGV4dC5ib3VuZHMuY2VudGVyLnkpO1xuXHR9XG5cdGlmIChfcHJvcGVydGllcy5yZWdpc3RyYXRpb24gPT09IFwidG9wXCIpIHtcblx0XHRkZXJpdmVkQ29udGV4dC5tb3ZlUmVnaXN0cmF0aW9uKGRlcml2ZWRDb250ZXh0LmJvdW5kcy5jZW50ZXIueCwgZGVyaXZlZENvbnRleHQuYm91bmRzLnRvcCk7XG5cdH1cblx0aWYgKF9wcm9wZXJ0aWVzLnJlZ2lzdHJhdGlvbiA9PT0gXCJib3R0b21cIikge1xuXHRcdGRlcml2ZWRDb250ZXh0Lm1vdmVSZWdpc3RyYXRpb24oZGVyaXZlZENvbnRleHQuYm91bmRzLmNlbnRlci54LCBkZXJpdmVkQ29udGV4dC5ib3VuZHMuYm90dG9tKTtcblx0fVxuXHRpZiAoX3Byb3BlcnRpZXMucmVnaXN0cmF0aW9uID09PSBcImxlZnRcIikge1xuXHRcdGRlcml2ZWRDb250ZXh0Lm1vdmVSZWdpc3RyYXRpb24oZGVyaXZlZENvbnRleHQuYm91bmRzLmxlZnQsIGRlcml2ZWRDb250ZXh0LmJvdW5kcy5jZW50ZXIueSk7XG5cdH1cblx0aWYgKF9wcm9wZXJ0aWVzLnJlZ2lzdHJhdGlvbiA9PT0gXCJyaWdodFwiKSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubW92ZVJlZ2lzdHJhdGlvbihkZXJpdmVkQ29udGV4dC5ib3VuZHMucmlnaHQsIGRlcml2ZWRDb250ZXh0LmJvdW5kcy5jZW50ZXIueSk7XG5cdH1cblx0aWYgKF9wcm9wZXJ0aWVzLnJlZ2lzdHJhdGlvbiA9PT0gXCJ0b3BfbGVmdFwiKSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubW92ZVJlZ2lzdHJhdGlvbihkZXJpdmVkQ29udGV4dC5ib3VuZHMubGVmdCwgZGVyaXZlZENvbnRleHQuYm91bmRzLnRvcCk7XG5cdH1cblx0aWYgKF9wcm9wZXJ0aWVzLnJlZ2lzdHJhdGlvbiA9PT0gXCJ0b3BfcmlnaHRcIikge1xuXHRcdGRlcml2ZWRDb250ZXh0Lm1vdmVSZWdpc3RyYXRpb24oZGVyaXZlZENvbnRleHQuYm91bmRzLnJpZ2h0LCBkZXJpdmVkQ29udGV4dC5ib3VuZHMudG9wKTtcblx0fVxuXHRpZiAoX3Byb3BlcnRpZXMucmVnaXN0cmF0aW9uID09PSBcImJvdHRvbV9sZWZ0XCIpIHtcblx0XHRkZXJpdmVkQ29udGV4dC5tb3ZlUmVnaXN0cmF0aW9uKGRlcml2ZWRDb250ZXh0LmJvdW5kcy5sZWZ0LCBkZXJpdmVkQ29udGV4dC5ib3VuZHMuYm90dG9tKTtcblx0fVxuXHRpZiAoX3Byb3BlcnRpZXMucmVnaXN0cmF0aW9uID09PSBcImJvdHRvbV9yaWdodFwiKSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubW92ZVJlZ2lzdHJhdGlvbihkZXJpdmVkQ29udGV4dC5ib3VuZHMucmlnaHQsIGRlcml2ZWRDb250ZXh0LmJvdW5kcy5ib3R0b20pO1xuXHR9XG5cdFxuXHRpZiAoX3Byb3BlcnRpZXMudHJhbnNsYXRlX3ggfHwgX3Byb3BlcnRpZXMudHJhbnNsYXRlX3kpIHtcblx0XHRkZXJpdmVkQ29udGV4dC5tYXRyaXgudHJhbnNsYXRlKF9wcm9wZXJ0aWVzLnRyYW5zbGF0ZV94IHx8IDAsIF9wcm9wZXJ0aWVzLnRyYW5zbGF0ZV95IHx8IDApO1xuXHR9XG5cblx0aWYgKF9wcm9wZXJ0aWVzLnJvdGF0aW9uKSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubWF0cml4LnJvdGF0ZShfcHJvcGVydGllcy5yb3RhdGlvbik7XG5cdH1cblxuXHRpZiAoX3Byb3BlcnRpZXMuc2NhbGVfeCB8fCBfcHJvcGVydGllcy5zY2FsZV95KSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubWF0cml4LnNjYWxlKF9wcm9wZXJ0aWVzLnNjYWxlX3ggfHwgMSwgX3Byb3BlcnRpZXMuc2NhbGVfeSB8fCAxKTtcblx0fVxuXG5cblx0cmV0dXJuIGRlcml2ZWRDb250ZXh0O1xufTtcblxuXG5Db250ZXh0LnByb3RvdHlwZS5tb3ZlUmVnaXN0cmF0aW9uID0gZnVuY3Rpb24oX3gsIF95KSB7XG5cdHRoaXMuYm91bmRzLnggLT0gX3g7XG5cdHRoaXMuYm91bmRzLnkgLT0gX3k7XG5cdHRoaXMubWF0cml4LnRyYW5zbGF0ZShfeCwgX3kpO1xufTtcblxuQ29udGV4dC5wcm90b3R5cGUuY2VudGVyUmVnaXN0cmF0aW9uID0gZnVuY3Rpb24oKSB7XG5cdHZhciBvbGRDZW50ZXIgPSB0aGlzLmJvdW5kcy5jZW50ZXI7XG5cdHRoaXMuYm91bmRzLnggLT0gb2xkQ2VudGVyLng7XG5cdHRoaXMuYm91bmRzLnkgLT0gb2xkQ2VudGVyLnk7XG5cdHRoaXMubWF0cml4LnRyYW5zbGF0ZShvbGRDZW50ZXIpO1xufTtcblxuXG5cbmZ1bmN0aW9uIGRlcml2ZUJvdW5kKHBhcmVudEJvdW5kLCBwYXJlbnRPcHBvc2l0ZUJvdW5kLCBwb3NpdGlvblJlbGF0aXZlLCBib3VuZFJlbGF0aXZlLCBvcHBvc2l0ZVBvc2l0aW9uUmVsYXRpdmUsIG9wcG9zaXRlQm91bmRSZWxhdGl2ZSwgZGltZW5zaW9uLCBkaXJlY3Rpb24pIHtcblxuXHRpZiAodHlwZW9mIHBvc2l0aW9uUmVsYXRpdmUgPT09IFwibnVtYmVyXCIpIHtcblx0XHRyZXR1cm4gcG9zaXRpb25SZWxhdGl2ZTtcblx0fVxuXG5cdGVsc2UgaWYgKHR5cGVvZiBib3VuZFJlbGF0aXZlID09PSBcIm51bWJlclwiKSB7XG5cdFx0cmV0dXJuIHBhcmVudEJvdW5kICsgYm91bmRSZWxhdGl2ZSAqIC1kaXJlY3Rpb247XG5cdH1cblxuXHRlbHNlIGlmICh0eXBlb2Ygb3Bwb3NpdGVQb3NpdGlvblJlbGF0aXZlID09PSBcIm51bWJlclwiICYmIHR5cGVvZiBkaW1lbnNpb24gPT09IFwibnVtYmVyXCIpIHtcblx0XHRyZXR1cm4gb3Bwb3NpdGVQb3NpdGlvblJlbGF0aXZlICsgZGltZW5zaW9uICogZGlyZWN0aW9uO1xuXHR9XG5cblx0ZWxzZSBpZiAodHlwZW9mIG9wcG9zaXRlQm91bmRSZWxhdGl2ZSA9PT0gXCJudW1iZXJcIiAmJiB0eXBlb2YgZGltZW5zaW9uID09PSBcIm51bWJlclwiKSB7XG5cdFx0cmV0dXJuIChwYXJlbnRPcHBvc2l0ZUJvdW5kICsgb3Bwb3NpdGVCb3VuZFJlbGF0aXZlICogZGlyZWN0aW9uKSArIGRpbWVuc2lvbiAqIGRpcmVjdGlvbjtcblx0fVxuXG5cdGVsc2UgaWYgKHR5cGVvZiBkaW1lbnNpb24gPT09IFwibnVtYmVyXCIpIHtcblx0XHRyZXR1cm4gKGRpbWVuc2lvbiAqIDAuNSAqIGRpcmVjdGlvbik7XG5cdH1cblxuXHRlbHNlIGlmICh0eXBlb2Ygb3Bwb3NpdGVQb3NpdGlvblJlbGF0aXZlID09PSBcIm51bWJlclwiKSB7XG5cdFx0cmV0dXJuIG9wcG9zaXRlUG9zaXRpb25SZWxhdGl2ZTtcblx0fVxuXG5cdGVsc2Uge1xuXHRcdHJldHVybiBwYXJlbnRCb3VuZDtcblx0fVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciBqc1lBTUwgPSByZXF1aXJlKCdqcy15YW1sJyk7XG52YXIgbG9nID0gcmVxdWlyZSgnLi91aS9Mb2cuanMnKS5zaGFyZWRJbnN0YW5jZSgpO1xudmFyIGxhbmd1YWdlID0gcmVxdWlyZSgnLi9sYW5ndWFnZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cy5wYXJzZSA9IHBhcnNlO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBQYXJzZXJcblxuZnVuY3Rpb24gcGFyc2UoX3lhbWwpIHtcblx0dmFyIGRhdGE7XG5cblx0bG9nLmFwcGVuZE1lc3NhZ2UoXCJQYXJzaW5nIFlBTUxcIik7XG5cdFxuXHQvLyB0cnkgZmlyc3Qgd2l0aG91dCBpbmplY3Rpb25zLCBzbyB0aGF0IGVycm9ycyB3aWxsIGhhdmUgY29ycmVjdCBsaW5lIG51bWJlcnNcblx0dHJ5IHtcblx0XHRkYXRhID0ganNZQU1MLnNhZmVMb2FkKF95YW1sKTtcblx0fVxuXHRjYXRjaCAoZSkge1xuXHRcdHJldHVybiBsb2cuYXBwZW5kUGFyc2VFcnJvcihlKTtcblx0fVxuXG5cblx0X3lhbWwgPSBpbmplY3RFZGl0b3JQcm9wZXJ0aWVzKF95YW1sKTtcblxuXHQvLyBwYXJzZSBhZ2FpbiwgZm9yIHJlYWwgdGhpcyB0aW1lXG5cdHRyeSB7XG5cdFx0ZGF0YSA9IGpzWUFNTC5zYWZlTG9hZChfeWFtbCk7XG5cdH1cblx0Y2F0Y2ggKGUpIHtcblx0XHRyZXR1cm4gbG9nLmFwcGVuZFBhcnNlRXJyb3IoZSk7XG5cdH1cblxuXHRpZiAoZGF0YSA9PT0gbnVsbCB8fCB0eXBlb2YgZGF0YSAhPT0gXCJvYmplY3RcIikge1xuXHRcdHJldHVybiBsb2cuYXBwZW5kRXJyb3IoXCJDb3VsZG4ndCBwYXJzZSBZQU1MLlwiKTtcblx0fVxuXG5cdC8vIHRvZG8gZGVmYXVsdCBkb2N1bWVudCBnb2VzIGhlcmVcblx0aWYgKCFkYXRhLnByb3BlcnRpZXMpIGRhdGEucHJvcGVydGllcyA9IHt9O1xuXG5cdHJldHVybiBkYXRhO1xufVxuXG5mdW5jdGlvbiBpbmplY3RFZGl0b3JQcm9wZXJ0aWVzKF95YW1sKSB7XG5cblx0dmFyIGxpbmVzID0gX3lhbWwuc3BsaXQoXCJcXG5cIik7XG5cblx0dmFyIHJlZ2lvbktleXdvcmRzID0gXyhsYW5ndWFnZS5yZWdpb25UeXBlcykucGx1Y2soXCJrZXl3b3JkXCIpO1xuXHRyZWdpb25LZXl3b3JkcyA9IF8ocmVnaW9uS2V5d29yZHMpLmZpbHRlciggZnVuY3Rpb24oX3ZhbHVlKSB7XG5cdFx0cmV0dXJuIF92YWx1ZTsgLy8gcmVtb3ZlIHVudHJ1dGh5IHZhbHVlc1xuXHR9KTtcblx0cmVnaW9uS2V5d29yZHMgPSBcIig/OlwiICsgcmVnaW9uS2V5d29yZHMuam9pbihcInxcIikgKyBcIilcIjtcblx0Ly8gY29uc29sZS5sb2cocmVnaW9uS2V5d29yZHMpO1xuXHR2YXIgbWFwUGF0dGVybiA9IG5ldyBSZWdFeHAocmVnaW9uS2V5d29yZHMrXCI6XFxcXHMqJFwiKTtcblxuXHR2YXIgZmlyc3RMaW5lO1xuXHR2YXIgbGFzdExpbmU7XG5cblx0dmFyIHJhbmdlcyA9IFtdO1xuXG5cdHZhciBkb2N1bWVudERhdGEgPSB7XG5cdFx0Zmlyc3RMaW5lOiAwLFxuXHRcdGxhc3RMaW5lOiBsaW5lcy5sZW5ndGhcblx0fTtcblxuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcblxuXHRcdHZhciBpc1RhcmdldCA9IG1hcFBhdHRlcm4udGVzdChsaW5lc1tpXSk7XG5cblx0XHRpZiAoaXNUYXJnZXQpIHtcblx0XHRcdHZhciBpbmRlbnQgPSBcIiAgICBcIjtcblx0XHRcdHZhciB3aGl0ZXNwYWNlID0gL14oXFxzKikvLmV4ZWMobGluZXNbaV0pWzFdO1xuXG5cdFx0XHRmb3IgKHZhciBpaSA9IGkgKyAxOyBpaSA8IGxpbmVzLmxlbmd0aDsgaWkrKykge1xuXHRcdFx0XHRpZiAobGluZXNbaWldLnRyaW0oKSA9PT0gJycpIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAobGluZXNbaWldLmluZGV4T2Yod2hpdGVzcGFjZSArIGluZGVudCkgIT09IDApIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRmaXJzdExpbmUgPSBpO1xuXHRcdFx0bGFzdExpbmUgPSBpaSAtIDE7XG5cdFx0XHRyYW5nZXMucHVzaCh7XG5cdFx0XHRcdGZpcnN0TGluZTogZmlyc3RMaW5lLFxuXHRcdFx0XHRsYXN0TGluZTogbGFzdExpbmUsXG5cdFx0XHRcdGluamVjdEluZGVudDogd2hpdGVzcGFjZSArIGluZGVudFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0Zm9yICh2YXIgciA9IHJhbmdlcy5sZW5ndGggLSAxOyByID49IDA7IHItLSkge1xuXHRcdHZhciBkYXRhID0ge1xuXHRcdFx0Zmlyc3RMaW5lOiByYW5nZXNbcl0uZmlyc3RMaW5lLFxuXHRcdFx0bGFzdExpbmU6IHJhbmdlc1tyXS5sYXN0TGluZVxuXHRcdH07XG5cdFx0dmFyIGluamVjdGlvbiA9IHJhbmdlc1tyXS5pbmplY3RJbmRlbnQgKyBcImVkaXRvcl9wcm9wZXJ0aWVzOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuXHRcdGxpbmVzLnNwbGljZShyYW5nZXNbcl0uZmlyc3RMaW5lICsgMSwgMCwgaW5qZWN0aW9uKTtcblx0fVxuXG5cblx0bGluZXMuc3BsaWNlKDAsIDAsIFwiZWRpdG9yX3Byb3BlcnRpZXM6IFwiICsgSlNPTi5zdHJpbmdpZnkoZG9jdW1lbnREYXRhKSk7XG5cblx0Ly8gY29uc29sZS5sb2cobGluZXMuam9pbihcIlxcblwiKSk7XG5cblx0cmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG5cblxufVxuXG4iLCJyZXF1aXJlKCcuL2pxdWVyeV91dGlsLmpzJyk7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciBNdXN0YWNoZSA9IHJlcXVpcmUoJ211c3RhY2hlJyk7XG52YXIgbGFuZ3VhZ2UgPSByZXF1aXJlKCcuL2xhbmd1YWdlLmpzJyk7XG52YXIgUHJldmlldyA9IHJlcXVpcmUoJy4vdWkvUHJldmlldy5qcycpO1xudmFyIHJlZ2lvblR5cGVzID0gcmVxdWlyZSgnLi9yZWdpb24vcmVnaW9uVHlwZXMuanMnKTtcbnZhciBQYXJzZXIgPSByZXF1aXJlKCcuL1BhcnNlci5qcycpO1xuXG5mdW5jdGlvbiBwb3B1bGF0ZVRlbXBsYXRlcygpIHtcblx0Ly8gcHJlcGFyZSBkYXRhXG5cdHZhciBkYXRhID0ge307XG5cblx0ZGF0YS5yZWdpb25UeXBlcyA9IF8obGFuZ3VhZ2UucmVnaW9uVHlwZXMpLnZhbHVlcygpO1xuXHRfKHJlZ2lvblR5cGVzKS5lYWNoKGZ1bmN0aW9uKHR5cGUpe1xuXHRcdHR5cGUucmVxdWlyZWRfcHJvcGVydGllcyA9IF8odHlwZS5wcm9wZXJ0aWVzKS5maWx0ZXIoIGZ1bmN0aW9uKHByb3ApIHtcblx0XHRcdHJldHVybiBwcm9wLnJlcXVpcmVkICYmIHByb3AucmVxdWlyZWQgPT09IHRydWU7XG5cdFx0fSk7XG5cdFx0XG5cdFx0dHlwZS5wcm9wZXJ0aWVzID0gXyh0eXBlLnByb3BlcnRpZXMpLmRpZmZlcmVuY2UodHlwZS5yZXF1aXJlZF9wcm9wZXJ0aWVzKTtcblx0XHRcblx0XHRpZiAodHlwZS5leHRlbmRzICYmIGxhbmd1YWdlLnJlZ2lvblR5cGVzW3R5cGUuZXh0ZW5kc10pIHtcblx0XHRcdHR5cGUuaW5oZXJpdGVkX3Byb3BlcnRpZXMgPSBsYW5ndWFnZS5yZWdpb25UeXBlc1t0eXBlLmV4dGVuZHNdLnByb3BlcnRpZXM7XG5cdFx0fVxuXHR9KTtcblxuXG5cdHZhciBtZW51VGVtcGxhdGUgPSAkKCcjdGVtcGxhdGUtbWVudScpLmh0bWwoKTtcblx0TXVzdGFjaGUucGFyc2UobWVudVRlbXBsYXRlKTsgLy8gb3B0aW9uYWwsIHNwZWVkcyB1cCBmdXR1cmUgdXNlc1xuXHR2YXIgbWVudVJlbmRlcmVkID0gTXVzdGFjaGUucmVuZGVyKG1lbnVUZW1wbGF0ZSwgZGF0YSk7XG5cdCQoJyN0ZW1wbGF0ZS1tZW51JykuaHRtbChtZW51UmVuZGVyZWQpO1xuXG5cdHZhciB0ZW1wbGF0ZSA9ICQoJyN0ZW1wbGF0ZS1yZWdpb25UeXBlcycpLmh0bWwoKS5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKTtcblx0dmFyIHByb3BlcnR5VGVtcGxhdGUgPSAkKCcjdGVtcGxhdGUtcHJvcGVydHknKS5odG1sKCk7XG5cdHZhciByZW5kZXJlZCA9IE11c3RhY2hlLnRvX2h0bWwodGVtcGxhdGUsIGRhdGEsIHtwcm9wOiBwcm9wZXJ0eVRlbXBsYXRlfSk7XG5cdCQoJyN0ZW1wbGF0ZS1yZWdpb25UeXBlcycpLmh0bWwocmVuZGVyZWQpO1xuXG5cblx0Ly9lbmFibGUgcHJvcGVydHkgY2xpY2tpbmdcblxuXHQvL2Nsb3NlIGluaGVyZXRpZCBwcm9wZXJ0aWVzXG5cdCQoXCIucHJvcGVydGllcy5pbmhlcml0ZWQtcHJvcGVydGllcyBsaVwiKS5hZGRDbGFzcyhcImNsb3NlZFwiKTtcblxuXHQvL21ha2UgcHJvcGVydGllcyBjbGlja2FibGVcblx0JChcIi5wcm9wZXJ0eS1uYW1lXCIpLmNzcyhcImN1cnNvclwiLCBcInBvaW50ZXJcIik7XG5cdCQoXCIucHJvcGVydHktbmFtZVwiKS5jbGljayhcblx0XHRmdW5jdGlvbigpIHtcblx0XHRcdCQodGhpcykucGFyZW50KCkudG9nZ2xlQ2xhc3MoXCJjbG9zZWRcIik7XG5cdFx0fVxuXHQpO1xufVxuXG5cbmZ1bmN0aW9uIHJlbmRlckV4YW1wbGVzKCkge1xuXHQkKCdwcmUnKS5lYWNoKCBmdW5jdGlvbihfaW5kZXgsIF9lbGVtZW50KSB7XG5cdFx0dmFyIHNvdXJjZSA9ICQoX2VsZW1lbnQpLnRleHQoKTtcblx0XHRjb25zb2xlLmxvZyhcInNvdXJjZVwiLCBzb3VyY2UpO1xuXHRcdHZhciBkYXRhID0gUGFyc2VyLnBhcnNlKHNvdXJjZSk7XG5cdFx0aWYgKCFkYXRhKSByZXR1cm47XG5cblx0XHR2YXIgZG9jID0gbmV3IHJlZ2lvblR5cGVzLkRvY3VtZW50KCk7XG5cdFx0ZG9jLmxvYWREYXRhKGRhdGEpO1xuXHRcdGNvbnNvbGUubG9nKFwiZG9jXCIsIGRhdGEsIGRvYy5wcm9wZXJ0aWVzKTtcblx0XHRkb2MucHJvcGVydGllcy5sZWZ0ID0gMDtcblx0XHRkb2MucHJvcGVydGllcy50b3AgPSAwO1xuXHRcdGRvYy5wcm9wZXJ0aWVzLndpZHRoID0gZGF0YS5wcm9wZXJ0aWVzLndpZHRoIHx8IDUyNTtcblx0XHRkb2MucHJvcGVydGllcy5oZWlnaHQgPSBkYXRhLnByb3BlcnRpZXMuaGVpZ2h0IHx8IDIyNTtcblx0XHRkb2MucHJvcGVydGllcy5yZWdpc3RyYXRpb24gPSBcImNlbnRlclwiO1xuXG5cblx0XHR2YXIgY2FudmFzID0gJChcIjxjYW52YXM+XCIpXG5cdFx0XHQuYXR0cihcImlkXCIsIFwiZXhhbXBsZS1cIitfaW5kZXgpXG5cdFx0XHQuYXR0cihcIndpZHRoXCIsIGRvYy5wcm9wZXJ0aWVzLndpZHRoICsgMjUpXG5cdFx0XHQuYXR0cihcImhlaWdodFwiLCBkb2MucHJvcGVydGllcy5oZWlnaHQgKyAyNSk7XG5cblxuXHRcdHZhciBwcmV2aWV3ID0gbmV3IFByZXZpZXcoKTtcblx0XHRwcmV2aWV3LmluaXQoY2FudmFzLmdldCgwKSk7XG5cblx0XHQvLyBVSS5wcmV2aWV3LmluaXQoJCgnI3BhcGVyLWNhbnZhcycpLmdldCgwKSk7XG5cdFx0cHJldmlldy5zZXREb2N1bWVudChkb2MpO1xuXG5cblx0XHRjYW52YXMuaW5zZXJ0QmVmb3JlKF9lbGVtZW50KTtcblx0fSk7XG5cblx0XG5cblxuXHQkKCdwcmUnKS5hZGRDbGFzcygncHJldHR5cHJpbnQnKTtcblx0cHJldHR5UHJpbnQoKTtcbn1cblxuJChmdW5jdGlvbigpIHtcblxuXHRcblx0cG9wdWxhdGVUZW1wbGF0ZXMoKTtcblx0cmVuZGVyRXhhbXBsZXMoKTtcblxuXHRcblxuXG5cdFxufSk7XG4iLCJ2YXIgdG9waWNzID0ge307XG5cblxualF1ZXJ5LlRvcGljID0gZnVuY3Rpb24oIGlkICkge1xuICAgIHZhciBjYWxsYmFja3MsXG4gICAgICAgIHRvcGljID0gaWQgJiYgdG9waWNzWyBpZCBdO1xuICAgIGlmICggIXRvcGljICkge1xuICAgICAgICBjYWxsYmFja3MgPSBqUXVlcnkuQ2FsbGJhY2tzKCk7XG4gICAgICAgIHRvcGljID0ge1xuICAgICAgICAgICAgcHVibGlzaDogY2FsbGJhY2tzLmZpcmUsXG4gICAgICAgICAgICBzdWJzY3JpYmU6IGNhbGxiYWNrcy5hZGQsXG4gICAgICAgICAgICB1bnN1YnNjcmliZTogY2FsbGJhY2tzLnJlbW92ZVxuICAgICAgICB9O1xuICAgICAgICBpZiAoIGlkICkge1xuICAgICAgICAgICAgdG9waWNzWyBpZCBdID0gdG9waWM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRvcGljO1xufTtcbi8vIFRvcGljIGNyZWF0ZXMgYSBnbG9iYWwgcHViL3N1YiBkaXNwYXRjaGVyLiBDb2RlIGpxdWVyeSBkb2N1bWVudGF0aW9uXG4vLyBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LkNhbGxiYWNrcy9cbi8vIGV4YW1wbGUgdXNhZ2U6XG4vLyAkLlRvcGljKCBcIm1haWxBcnJpdmVkXCIgKS5zdWJzY3JpYmUoIGZuMSApO1xuLy8gJC5Ub3BpYyggXCJtYWlsQXJyaXZlZFwiICkucHVibGlzaCggXCJoZWxsbyB3b3JsZCFcIiApO1xuXG5cblxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy82MjU5MzAxL2pxdWVyeS1kZWZlcnJlZC10dXJuLWZhaWx1cmUtaW50by1zdWNjZXNzXG4vLyBodHRwOi8vanNmaWRkbGUubmV0L0luZmluaXRpZXNMb29wL3lRc1lLL1xualF1ZXJ5LndoZW5BbGwgPSBmdW5jdGlvbiggZmlyc3RQYXJhbSApIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgc2xpY2VEZWZlcnJlZCA9IFtdLnNsaWNlLFxuICAgICAgICBpID0gMCxcbiAgICAgICAgbGVuZ3RoID0gYXJncy5sZW5ndGgsXG4gICAgICAgIGNvdW50ID0gbGVuZ3RoLFxuICAgICAgICByZWplY3RlZCxcbiAgICAgICAgZGVmZXJyZWQgPSBsZW5ndGggPD0gMSAmJiBmaXJzdFBhcmFtICYmIGpRdWVyeS5pc0Z1bmN0aW9uKCBmaXJzdFBhcmFtLnByb21pc2UgKSA/IGZpcnN0UGFyYW0gOiBqUXVlcnkuRGVmZXJyZWQoKTtcbiAgICBcbiAgICBmdW5jdGlvbiByZXNvbHZlRnVuYyggaSwgcmVqZWN0ICkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oIHZhbHVlICkge1xuICAgICAgICAgICAgcmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgYXJnc1sgaSBdID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBzbGljZURlZmVycmVkLmNhbGwoIGFyZ3VtZW50cywgMCApIDogdmFsdWU7XG4gICAgICAgICAgICBpZiAoICEoIC0tY291bnQgKSApIHtcbiAgICAgICAgICAgICAgICAvLyBTdHJhbmdlIGJ1ZyBpbiBGRjQ6XG4gICAgICAgICAgICAgICAgLy8gVmFsdWVzIGNoYW5nZWQgb250byB0aGUgYXJndW1lbnRzIG9iamVjdCBzb21ldGltZXMgZW5kIHVwIGFzIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAvLyBvdXRzaWRlIHRoZSAkLndoZW4gbWV0aG9kLiBDbG9uaW5nIHRoZSBvYmplY3QgaW50byBhIGZyZXNoIGFycmF5IHNvbHZlcyB0aGUgaXNzdWVcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSByZWplY3RlZCA/IGRlZmVycmVkLnJlamVjdFdpdGggOiBkZWZlcnJlZC5yZXNvbHZlV2l0aDtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGRlZmVycmVkLCBkZWZlcnJlZCwgc2xpY2VEZWZlcnJlZC5jYWxsKCBhcmdzLCAwICkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICBpZiAoIGxlbmd0aCA+IDEgKSB7XG4gICAgICAgIGZvciggOyBpIDwgbGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICBpZiAoIGFyZ3NbIGkgXSAmJiBqUXVlcnkuaXNGdW5jdGlvbiggYXJnc1sgaSBdLnByb21pc2UgKSApIHtcbiAgICAgICAgICAgICAgICBhcmdzWyBpIF0ucHJvbWlzZSgpLnRoZW4oIHJlc29sdmVGdW5jKGkpLCByZXNvbHZlRnVuYyhpLCB0cnVlKSApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAtLWNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICggIWNvdW50ICkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZVdpdGgoIGRlZmVycmVkLCBhcmdzICk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCBkZWZlcnJlZCAhPT0gZmlyc3RQYXJhbSApIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZVdpdGgoIGRlZmVycmVkLCBsZW5ndGggPyBbIGZpcnN0UGFyYW0gXSA6IFtdICk7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlKCk7XG59O1xuXG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBnbG9iYWwgcmVnaW9uVHlwZXMgKi9cbi8vIHJlcXVpcmVzXG5cbm1vZHVsZS5leHBvcnRzLnJlZ2lvblR5cGVzID0gcmVnaW9uVHlwZXM7XG5tb2R1bGUuZXhwb3J0cy51bml0U2NhbGVzID0ge1xuXHRcInB4XCI6IDEsXG5cdFwiaW5cIjogNzIsXG5cdFwiZnRcIjogNzIqMTIsXG5cdFwibW1cIjogMi44MzQ2NDU2Nyxcblx0XCJjbVwiOiAyOC4zNDY0NTY3LFxuXHRcIm1cIjogMjgzNC42NDU2N1xufTtcbiIsIlxuLy8gdGFrZXMgYW4gYXJyYXkgb2YgX3BhdGhzIGFuZCBjb21iaW5lcyB0aGUgZmlyc3QgaXRlbSB3aXRoIGFsbCByZW1haW5pbmcgaXRlbXMgdXNpbmcgdGhlIGJvb2xlYW4gX29wZXJhdGlvbiBcblxubW9kdWxlLmV4cG9ydHMuY29tYmluZVBhdGhzID0gZnVuY3Rpb24oX3BhdGhzLCBfb3BlcmF0aW9uKSB7XG5cdGlmIChfcGF0aHMubGVuZ3RoIDwgMSkgcmV0dXJuIFtdO1xuXG5cdGNvbnNvbGUubG9nKFwiY3BcIiwgX3BhdGhzLCBfb3BlcmF0aW9uKTtcblx0XG5cdHZhciBuZXdQYXRoID0gX3BhdGhzWzBdO1xuXHRmb3IgKHZhciBpID0gMTsgaSA8IF9wYXRocy5sZW5ndGg7IGkrKykge1xuXHRcdG5ld1BhdGgucmVtb3ZlKCk7XG5cdFx0X3BhdGhzW2ldLnJlbW92ZSgpO1xuXHRcdG5ld1BhdGggPSBuZXdQYXRoW19vcGVyYXRpb25dKF9wYXRoc1tpXSk7XG5cdH1cblxuXHRyZXR1cm4gbmV3UGF0aDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWdpb24gPSByZXF1aXJlKCcuL1JlZ2lvbi5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRG9jdW1lbnQ7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIERvY3VtZW50XG5cbmZ1bmN0aW9uIERvY3VtZW50KF9kYXRhLCBfcGFyZW50KSB7XG5cdFJlZ2lvbi5jYWxsKHRoaXMsIF9kYXRhLCBfcGFyZW50KTtcblx0dGhpcy50eXBlID0gXCJEb2N1bWVudFwiO1xuXHR0aGlzLndhaXRMaXN0ID0gW107XG59XG5cbkRvY3VtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUmVnaW9uLnByb3RvdHlwZSk7XG5Eb2N1bWVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEb2N1bWVudDtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciBSZWdpb24gPSByZXF1aXJlKCcuL1JlZ2lvbi5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVsbGlwc2U7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEVsbGlwc2VcblxuZnVuY3Rpb24gRWxsaXBzZShfZGF0YSwgX3BhcmVudCkge1xuXHRSZWdpb24uY2FsbCh0aGlzLCBfZGF0YSwgX3BhcmVudCk7XG5cdHRoaXMudHlwZSA9IFwiRWxsaXBzZVwiO1xuXHR0aGlzLmlzU2hhcGUgPSB0cnVlO1xufVxuXG5FbGxpcHNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUmVnaW9uLnByb3RvdHlwZSk7XG5FbGxpcHNlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEVsbGlwc2U7XG5cbkVsbGlwc2UucHJvdG90eXBlLmRyYXdCdWlsZCA9IGZ1bmN0aW9uKF9ib3VuZHMpIHtcblx0dmFyIGJvdW5kc1BhdGggPSBuZXcgcGFwZXIuUGF0aC5FbGxpcHNlKF9ib3VuZHMpO1xuXHRyZXR1cm4gYm91bmRzUGF0aDtcbn07XG5cblxuRWxsaXBzZS5wcm90b3R5cGUuZHJhd0JvdW5kcyA9IGZ1bmN0aW9uKF9ib3VuZHMpIHtcblx0cmV0dXJuIG5ldyBwYXBlci5QYXRoLkVsbGlwc2UoX2JvdW5kcyk7XG59O1xuXG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgUmVnaW9uID0gcmVxdWlyZSgnLi9SZWdpb24uanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWN0YW5nbGU7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFJlY3RhbmdsZVxuXG5mdW5jdGlvbiBSZWN0YW5nbGUoX2RhdGEsIF9wYXJlbnQpIHtcblx0UmVnaW9uLmNhbGwodGhpcywgX2RhdGEsIF9wYXJlbnQpO1xuXHR0aGlzLnR5cGUgPSBcIlJlY3RhbmdsZVwiO1xuXHR0aGlzLmlzU2hhcGUgPSB0cnVlO1xufVxuXG5SZWN0YW5nbGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWdpb24ucHJvdG90eXBlKTtcblJlY3RhbmdsZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBSZWN0YW5nbGU7XG5cblJlY3RhbmdsZS5wcm90b3R5cGUuZHJhd0J1aWxkID0gZnVuY3Rpb24oX2JvdW5kcykge1xuXHR2YXIgYm91bmRzUGF0aCA9IG5ldyBwYXBlci5QYXRoLlJlY3RhbmdsZShfYm91bmRzLCB0aGlzLnByb3BlcnRpZXMucmFkaXVzIHx8IDApO1xuXHRyZXR1cm4gYm91bmRzUGF0aDtcbn07XG5cblJlY3RhbmdsZS5wcm90b3R5cGUuZHJhd0JvdW5kcyA9IGZ1bmN0aW9uKF9ib3VuZHMpIHtcblx0cmV0dXJuIG5ldyBwYXBlci5QYXRoLlJlY3RhbmdsZShfYm91bmRzLCB0aGlzLnByb3BlcnRpZXMucmFkaXVzIHx8IDApO1xufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIHBhcGVyVXRpbCA9IHJlcXVpcmUoJy4uL3BhcGVyX3V0aWwuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vc2V0dGluZ3MuanMnKTtcbnZhciByZWdpb25UeXBlcyA9IHJlcXVpcmUoJy4vcmVnaW9uVHlwZXMuanMnKTtcbnZhciBDb250ZXh0ID0gcmVxdWlyZSgnLi4vQ29udGV4dC5qcycpO1xuXG52YXIgbGFuZ3VhZ2UgPSByZXF1aXJlKCcuLi9sYW5ndWFnZS5qcycpO1xudmFyIGxvZyA9IHJlcXVpcmUoJy4uL3VpL0xvZy5qcycpLnNoYXJlZEluc3RhbmNlKCk7IFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVnaW9uO1xuXG5cblxuLy8gdG9kbyBtb3ZlIHRoaXNcbi8vIG1hcHMgdGhlIGFsbG93ZWQgeWFtbCBuYW1lIHRvIHRoZSBjb3Jlc3BvbmRpbmcgcGFwZXJqcyBmdW5jdGlvblxudmFyIGJvb2xlYW5PcGVyYXRpb25zID0ge1xuXHRcImFkZFwiOiBcInVuaXRlXCIsXG5cdFwic3VidHJhY3RcIjogXCJzdWJ0cmFjdFwiLFxuXHRcImludGVyc2VjdFwiOiBcImludGVyc2VjdFwiXG59O1xuXG5cblxuZnVuY3Rpb24gUmVnaW9uKF9wYXJlbnQpIHtcblx0dGhpcy50eXBlID0gXCJSZWdpb25cIjtcblx0dGhpcy5wYXJlbnQgPSBfcGFyZW50IHx8IG51bGw7XG5cdHRoaXMucm9vdCA9IHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50LnJvb3QgfHwgdGhpcztcblxuXHR0aGlzLmNoaWxkcmVuID0gW107XG5cdHRoaXMucHJvcGVydGllcyA9IHt9O1xuXHRcblx0dGhpcy5lZGl0b3JQcm9wZXJ0aWVzID0ge307XG5cblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAgPSBudWxsO1xuXHR0aGlzLnByZXZpZXdQb3NpdGlvbkdyb3VwID0gbnVsbDtcblxuXHR0aGlzLmlzU2hhcGUgPSBmYWxzZTtcbn1cblxuUmVnaW9uLnByb3RvdHlwZS5wcm94eSA9IGZ1bmN0aW9uKCkge1xuXHQvLyB2YXIgcHJveHkgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpO1xuXHQvLyBwcm94eS5wYXJlbnQgPSB0aGlzLnBhcmVudDtcblx0Ly8gcHJveHkucm9vdCA9IHRoaXMucm9vdDtcblx0Ly8gcHJveHkuXG5cdHZhciBwcm94eSA9IE9iamVjdC5jcmVhdGUodGhpcyk7XG5cdC8vIHByb3h5LnByZXZpZXdCb3VuZHNHcm91cCA9IG51bGw7XG5cdHJldHVybiBwcm94eTtcbn07XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gTG9hZGluZ1xuXG5SZWdpb24ucHJvdG90eXBlLmxvYWREYXRhID0gZnVuY3Rpb24oX2RhdGEpIHtcblxuXHRpZiAodHlwZW9mIF9kYXRhLmVkaXRvcl9wcm9wZXJ0aWVzID09PSBcIm9iamVjdFwiICYmIF9kYXRhLmVkaXRvcl9wcm9wZXJ0aWVzICE9PSBudWxsKSB7XG5cdFx0dGhpcy5lZGl0b3JQcm9wZXJ0aWVzID0gXy5jbG9uZShfZGF0YS5lZGl0b3JfcHJvcGVydGllcyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIF9kYXRhLnByb3BlcnRpZXMgPT09IFwib2JqZWN0XCIgJiYgX2RhdGEucHJvcGVydGllcyAhPT0gbnVsbCkge1xuXHRcdHRoaXMubG9hZFByb3BlcnRpZXMoX2RhdGEucHJvcGVydGllcyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIF9kYXRhLmNoaWxkcmVuID09PSBcIm9iamVjdFwiICYmIF9kYXRhLmNoaWxkcmVuICE9PSBudWxsKSB7XG5cdFx0dGhpcy5sb2FkQ2hpbGRyZW4oX2RhdGEuY2hpbGRyZW4pO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5cblJlZ2lvbi5wcm90b3R5cGUubG9hZFByb3BlcnRpZXMgPSBmdW5jdGlvbihfcHJvcGVydGllcykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblxuXHQvL3RvZG8gcmVjdXJzZT9cblx0dmFyIGRlZmluaXRpb25zID0gbGFuZ3VhZ2UucmVnaW9uVHlwZXNbdGhpcy50eXBlXS5wcm9wZXJ0aWVzO1xuXHRpZiAoIUFycmF5LmlzQXJyYXkoZGVmaW5pdGlvbnMpKSB7XG5cdFx0ZGVmaW5pdGlvbnMgPSBbXTtcblx0fVxuXHR2YXIgc3VwZXJDbGFzcyA9IGxhbmd1YWdlLnJlZ2lvblR5cGVzW3RoaXMudHlwZV0uZXh0ZW5kcztcblx0aWYgKHN1cGVyQ2xhc3MpIHtcblx0XHRkZWZpbml0aW9ucyA9IHV0aWwubWVyZ2VPYmplY3RBcnJheXNPbktleShsYW5ndWFnZS5yZWdpb25UeXBlc1tzdXBlckNsYXNzXS5wcm9wZXJ0aWVzLCBkZWZpbml0aW9ucywgXCJrZXl3b3JkXCIpO1xuXHR9XG5cblx0XG5cblx0Ly8gQnVpbGQgbWVzc2FnZSBwcmVmaXhcblx0Ly8gdG9kbyBmYWN0b3IgdGhpcyBvdXRcblx0dmFyIG1lc3NhZ2VQcmVmaXggPSB0aGlzLnR5cGUgKyBcIjogXCI7XG5cdGlmICh0aGlzLmVkaXRvclByb3BlcnRpZXMuZmlyc3RMaW5lKSB7XG5cdFx0bWVzc2FnZVByZWZpeCA9IFwiW0xpbmUgXCIgKyB0aGlzLmVkaXRvclByb3BlcnRpZXMuZmlyc3RMaW5lICsgXCIgXCIgKyB0aGlzLnR5cGUgKyBcIl0gXCI7XG5cdH1cblxuXHQvLyBWYWxpZGF0ZSBhbmQgaW1wb3J0IHByb3ZpZGVkIHByb3BlcnRpZXMuXG5cdF8oX3Byb3BlcnRpZXMpLmVhY2goZnVuY3Rpb24ocFZhbHVlLCBwS2V5KSB7XG5cdFx0dmFyIGRlZiA9IF8oZGVmaW5pdGlvbnMpLmZpbmQoZnVuY3Rpb24oX2RlZikge1xuXHRcdFx0cmV0dXJuIF9kZWYua2V5d29yZCA9PT0gcEtleTtcblx0XHR9KTtcblxuXHRcdGlmICghZGVmKSB7XG5cdFx0XHRsb2cuYXBwZW5kV2FybmluZyhtZXNzYWdlUHJlZml4ICsgXCJVbmtub3duIHByb3BlcnR5OiBcIiArIHBLZXkpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcFZhbHVlID09IFwic3RyaW5nXCIgJiYgZGVmLnR5cGUgPT0gXCJudW1iZXJcIiAmJiAhaXNOYU4ocFZhbHVlKSAmJiBwVmFsdWUgIT09ICcnKSB7XG5cdFx0XHQvLyB0cnkgY2FzdGluZyBzdHJpbmdzIHRvIG51bWJlcnNcblx0XHRcdHBWYWx1ZSA9IE51bWJlcihwVmFsdWUpO1xuXG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwVmFsdWUgIT09IGRlZi50eXBlKSB7XG5cdFx0XHRsb2cuYXBwZW5kV2FybmluZyhtZXNzYWdlUHJlZml4ICsgXCJJbmNvcnJlY3QgdHlwZTogXCIgKyBwS2V5ICsgXCI8YnIgLz5SZWNlaXZlZCBcIiArIHR5cGVvZiBwVmFsdWUgKyBcIi4gRXhwZWN0ZWQgXCIgKyBkZWYudHlwZSArIFwiLlwiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZGVmLnZhbHVlcyAmJiAhXyhkZWYudmFsdWVzKS5jb250YWlucyhwVmFsdWUpKSB7XG5cdFx0XHRsb2cuYXBwZW5kV2FybmluZyhtZXNzYWdlUHJlZml4ICsgXCJVbnJlY29nbml6ZWQgdmFsdWUgZm9yIHByb3BlcnR5OiBcIiArIHBLZXkgKyBcIjxiciAvPlJlY2VpdmVkIFxcXCJcIiArIHBWYWx1ZSArIFwiXFxcIi4gRXhwZWN0ZWQgXCIgKyBkZWYudmFsdWVzLmpvaW4oXCIsIFwiKSArIFwiLlwiKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRzZWxmLnByb3BlcnRpZXNbcEtleV0gPSBwVmFsdWU7XG5cdH0pO1xuXG5cblx0Ly8gUG9wdWxhdGUgZGVmYXVsdHNcblx0XG5cdF8oZGVmaW5pdGlvbnMpLmNoYWluKClcblx0XHQuZmlsdGVyKGZ1bmN0aW9uKF9kZWYpIHtcblx0XHRcdHJldHVybiBfZGVmICYmIF9kZWYuZGVmYXVsdDtcblx0XHR9KVxuXHRcdC5lYWNoKGZ1bmN0aW9uKF9kZWYpIHtcblx0XHRcdHNlbGYucHJvcGVydGllc1tfZGVmLmtleXdvcmRdID0gc2VsZi5wcm9wZXJ0aWVzW19kZWYua2V5d29yZF0gfHwgX2RlZi5kZWZhdWx0O1xuXHRcdH0pO1xuXG5cblx0Ly8gRW5mb3JjZSByZXF1aXJlZFxuXHRfKGRlZmluaXRpb25zKS5jaGFpbigpXG5cdFx0LmZpbHRlcihmdW5jdGlvbihfZGVmKSB7XG5cdFx0XHRyZXR1cm4gX2RlZiAmJiBfZGVmLnJlcXVpcmVkID09PSB0cnVlO1xuXHRcdH0pXG5cdFx0LmVhY2goZnVuY3Rpb24oX2RlZikge1xuXHRcdFx0aWYgKHNlbGYucHJvcGVydGllc1tfZGVmLmtleXdvcmRdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0bG9nLmFwcGVuZFdhcm5pbmcoXG5cdFx0XHRcdFx0bWVzc2FnZVByZWZpeCArIFwiTWlzc2luZyByZXF1aXJlZCBwcm9wZXJ0eTogXCIgKyBfZGVmLmtleXdvcmRcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9KTtcblxufTtcblxuUmVnaW9uLnByb3RvdHlwZS5sb2FkQ2hpbGRyZW4gPSBmdW5jdGlvbihfY2hpbGRyZW5EYXRhKSB7XG5cblx0Xy5lYWNoKF9jaGlsZHJlbkRhdGEsIGZ1bmN0aW9uKF9jaGlsZERhdGEpIHtcblx0XHR2YXIgY2hpbGRLZXkgPSBfLmtleXMoX2NoaWxkRGF0YSlbMF07XG5cdFx0dmFyIGNoaWxkRGF0YSA9IF8udmFsdWVzKF9jaGlsZERhdGEpWzBdO1xuXG5cblx0XHR2YXIgZGVmID0gXyhsYW5ndWFnZS5yZWdpb25UeXBlcykuZmluZChmdW5jdGlvbihfZGVmKSB7XG5cdFx0XHRyZXR1cm4gX2RlZi5rZXl3b3JkID09PSBjaGlsZEtleTtcblx0XHR9KTtcblx0XHR2YXIgdGFyZ2V0Q2xhc3MgPSBkZWYgJiYgZGVmLmNsYXNzO1xuXG5cblx0XHRpZiAodGFyZ2V0Q2xhc3MgJiYgdGFyZ2V0Q2xhc3MgaW4gcmVnaW9uVHlwZXMpIHtcblx0XHRcdHZhciBjaGlsZCA9IG5ldyhyZWdpb25UeXBlc1t0YXJnZXRDbGFzc10pKHRoaXMpO1xuXHRcdFx0Y2hpbGQubG9hZERhdGEoY2hpbGREYXRhKTtcblx0XHRcdHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKGNoaWxkRGF0YS5lZGl0b3JfcHJvcGVydGllcykge1xuXHRcdFx0XHRsb2cuYXBwZW5kV2FybmluZyhcIltMaW5lIFwiICsgY2hpbGREYXRhLmVkaXRvcl9wcm9wZXJ0aWVzLmZpcnN0TGluZSArIFwiXSBVbmtub3duIHJlZ2lvbiB0eXBlOiBcIiArIGNoaWxkS2V5KTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRsb2cuYXBwZW5kV2FybmluZyhcIlVua25vd24gcmVnaW9uIHR5cGU6IFwiICsgY2hpbGRLZXkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9LCB0aGlzKTtcbn07XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gVXRpbFxuXG5SZWdpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdHZhciBzID0gdGhpcy50eXBlO1xuXHRpZiAodGhpcy5lZGl0b3JQcm9wZXJ0aWVzLmxpbmUpIHtcblx0XHRzICs9IFwiKFwiICsgdGhpcy5lZGl0b3JQcm9wZXJ0aWVzLmxpbmUgKyBcIilcIjtcblx0fVxuXHRzICs9IFwiOiBcIjtcblx0cyArPSB0aGlzLnByb3BlcnRpZXMubmFtZSB8fCBcInVubmFtZWRcIjtcblx0cmV0dXJuIHM7XG59O1xuXG5SZWdpb24ucHJvdG90eXBlLmJyZWFkQ3J1bWIgPSBmdW5jdGlvbigpIHtcblx0dmFyIGJjID0gW1wiXCIgKyB0aGlzXTtcblxuXHRpZiAodGhpcy5wYXJlbnQgIT09IG51bGwpIHtcblx0XHRiYyA9IHRoaXMucGFyZW50LmJyZWFkQ3J1bWIoKS5jb25jYXQoYmMpO1xuXHR9XG5cdHJldHVybiBiYztcbn07XG5cblJlZ2lvbi5wcm90b3R5cGUudHJlZSA9IGZ1bmN0aW9uKF9kZXB0aCkge1xuXHRfZGVwdGggPSBfZGVwdGggfHwgMDtcblxuXHR2YXIgdGV4dCA9IHRoaXMgKyBcIlxcblwiO1xuXG5cdF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihfY2hpbGQpIHtcblx0XHQvLyBjcmVhdGUgaW5kZW50XG5cdFx0XyhfZGVwdGggKyAxKS50aW1lcyhmdW5jdGlvbihpKSB7XG5cdFx0XHR0ZXh0ICs9IFwiXFx0XCI7XG5cdFx0fSk7XG5cblx0XHR0ZXh0ICs9IF9jaGlsZC50cmVlKF9kZXB0aCArIDEpO1xuXHR9KTtcblxuXHRyZXR1cm4gdGV4dDtcbn07XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gUHJldmlld1xuXG5SZWdpb24ucHJvdG90eXBlLnByZXZpZXcgPSBmdW5jdGlvbihfcGFyZW50Q29udGV4dCkge1xuXHR2YXIgY29udGV4dCA9IF9wYXJlbnRDb250ZXh0LmRlcml2ZUNvbnRleHQodGhpcy5wcm9wZXJ0aWVzKTtcblxuXHR0aGlzLnByZXZpZXdCb3VuZHNHcm91cCA9IG5ldyBwYXBlci5Hcm91cCgpO1xuXHR0aGlzLnByZXZpZXdQb3NpdGlvbkdyb3VwID0gbmV3IHBhcGVyLkdyb3VwKCk7XG5cblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25Nb3VzZUVudGVyID0gXy5iaW5kKHRoaXMub25Nb3VzZUVudGVyLCB0aGlzKTtcblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25Nb3VzZUxlYXZlID0gXy5iaW5kKHRoaXMub25Nb3VzZUxlYXZlLCB0aGlzKTtcblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25DbGljayA9IF8uYmluZCh0aGlzLm9uQ2xpY2ssIHRoaXMpO1xuXG5cdC8vIGJvdW5kc1xuXHR2YXIgYm91bmRzID0gdGhpcy5kcmF3Qm91bmRzKGNvbnRleHQuYm91bmRzKTtcblx0Ym91bmRzLnRyYW5zZm9ybShjb250ZXh0Lm1hdHJpeCk7XG5cdHRoaXMucHJldmlld0JvdW5kc0dyb3VwLmFkZENoaWxkKGJvdW5kcyk7XG5cblx0Ly8gcG9zXG5cdHZhciBwb3NpdGlvbiA9IHRoaXMuZHJhd1Bvc2l0aW9uKGNvbnRleHQucG9zaXRpb24sIGNvbnRleHQubWF0cml4KTtcblx0cG9zaXRpb24udHJhbnNmb3JtKGNvbnRleHQubWF0cml4KTtcblx0dGhpcy5wcmV2aWV3UG9zaXRpb25Hcm91cC5hZGRDaGlsZChwb3NpdGlvbik7XG5cblx0dGhpcy5zZXRTdHlsZShcImRlZmF1bHRcIik7XG5cblx0Ly8gY2hpbGRyZW5cblx0dGhpcy5wcmV2aWV3Q2hpbGRyZW4oY29udGV4dCk7XG59O1xuXG5cblJlZ2lvbi5wcm90b3R5cGUucHJldmlld0NoaWxkcmVuID0gZnVuY3Rpb24oX2NvbnRleHQpIHtcblx0Xy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKF9jaGlsZCkge1xuXHRcdF9jaGlsZC5wcmV2aWV3KF9jb250ZXh0KTtcblx0fSk7XG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gQnVpbGRcblxuUmVnaW9uLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uKF9wYXJlbnRDb250ZXh0KSB7XG5cdHZhciBjb250ZXh0ID0gX3BhcmVudENvbnRleHQuZGVyaXZlQ29udGV4dCh0aGlzLnByb3BlcnRpZXMpO1xuXG5cdHZhciBvd25QYXRocyA9IFtdLmNvbmNhdCh0aGlzLmRyYXdCdWlsZChjb250ZXh0LmJvdW5kcykpO1xuXHRfLmVhY2gob3duUGF0aHMsIGZ1bmN0aW9uKHApIHtcblx0XHRwLnRyYW5zZm9ybShjb250ZXh0Lm1hdHJpeCk7XG5cdH0sIHRoaXMpO1xuXG5cdHZhciBjaGlsZFBhdGhzID0gb3duUGF0aHMuY29uY2F0KHRoaXMuYnVpbGRDaGlsZHJlbihjb250ZXh0KSk7XG5cblxuXHRcblx0aWYgKCEoJ2Jvb2xlYW4nIGluIHRoaXMucHJvcGVydGllcykpIHtcblx0XHRyZXR1cm4gY2hpbGRQYXRocztcblx0fVxuXHRlbHNlIHtcblx0XHR2YXIgb3AgPSBib29sZWFuT3BlcmF0aW9uc1t0aGlzLnByb3BlcnRpZXMuYm9vbGVhbl07XG5cdFx0Y2hpbGRQYXRocyA9IHBhcGVyVXRpbC5jb21iaW5lUGF0aHMoY2hpbGRQYXRocywgb3ApO1xuXHR9XG5cblx0cmV0dXJuIGNoaWxkUGF0aHM7XG59O1xuXG5cblJlZ2lvbi5wcm90b3R5cGUuYnVpbGRDaGlsZHJlbiA9IGZ1bmN0aW9uKF9jb250ZXh0KSB7XG5cdHZhciBjaGlsZFBhdGhzID0gW107XG5cblx0Xy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKF9jaGlsZCkge1xuXHRcdHZhciBzID0gX2NoaWxkLmJ1aWxkKF9jb250ZXh0KTtcblx0XHRjaGlsZFBhdGhzID0gY2hpbGRQYXRocy5jb25jYXQocyk7XG5cdH0pO1xuXG5cdHJldHVybiBjaGlsZFBhdGhzO1xufTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEhhbmR5XG5cblJlZ2lvbi5wcm90b3R5cGUuZ2V0RGVjZW5kYW50cyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdXRpbC5jb2xsZWN0VHJlZSh0aGlzLCBcImNoaWxkcmVuXCIpO1xufTtcblxuUmVnaW9uLnByb3RvdHlwZS5nZXRBbmNlc3RvcnMgPSBmdW5jdGlvbigpIHtcblx0dmFyIGEgPSBbXTtcblx0aWYgKHRoaXMucGFyZW50KSB7XG5cdFx0cmV0dXJuIFt0aGlzLnBhcmVudF0uY29uY2F0KHRoaXMucGFyZW50LmdldEFuY2VzdG9ycygpKTtcblx0fVxuXHRyZXR1cm4gW107XG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gRXZlbnRzXG5cblJlZ2lvbi5wcm90b3R5cGUub25Nb3VzZUVudGVyID0gZnVuY3Rpb24oKSB7XG5cdCQuVG9waWMoXCJyZWdpb24vb25Nb3VzZUVudGVyXCIpLnB1Ymxpc2godGhpcyk7XG59O1xuXG5SZWdpb24ucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcblx0JC5Ub3BpYyhcInJlZ2lvbi9vbkNsaWNrXCIpLnB1Ymxpc2godGhpcyk7XG59O1xuXG5SZWdpb24ucHJvdG90eXBlLm9uTW91c2VMZWF2ZSA9IGZ1bmN0aW9uKCkge1xuXHQkLlRvcGljKFwicmVnaW9uL29uTW91c2VMZWF2ZVwiKS5wdWJsaXNoKHRoaXMpO1xufTtcblxuUmVnaW9uLnByb3RvdHlwZS5zZXRTdHlsZSA9IGZ1bmN0aW9uKF9zdHlsZSwgX3JlY3Vyc2l2ZSkge1xuXHRfc3R5bGUgPSBfc3R5bGUgfHwgXCJkZWZhdWx0XCI7XG5cdGlmICghc2V0dGluZ3Muc3R5bGVzLmJvdW5kc1tfc3R5bGVdKSByZXR1cm47XG5cblx0aWYgKHRoaXMuaXNTaGFwZSkge1xuXHRcdHRoaXMucHJldmlld0JvdW5kc0dyb3VwLnN0eWxlID0gc2V0dGluZ3Muc3R5bGVzLnNoYXBlW19zdHlsZV07XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAuc3R5bGUgPSBzZXR0aW5ncy5zdHlsZXMuYm91bmRzW19zdHlsZV07XG5cdH1cblx0dGhpcy5wcmV2aWV3UG9zaXRpb25Hcm91cC5zdHlsZSA9IHNldHRpbmdzLnN0eWxlcy5wb3NpdGlvbltfc3R5bGVdO1xuXG5cdGlmIChfcmVjdXJzaXZlKSB7XG5cdFx0Xyh0aGlzLmNoaWxkcmVuKS5pbnZva2UoJ3NldFN0eWxlJywgX3N0eWxlLCB0cnVlKTtcblx0fVxufTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBGdW5jdGlvbnMgdG8gT3ZlcnJpZGVcblxuXG5SZWdpb24ucHJvdG90eXBlLmRyYXdCb3VuZHMgPSBmdW5jdGlvbihfYm91bmRzKSB7XG5cdHJldHVybiBuZXcgcGFwZXIuUGF0aC5SZWN0YW5nbGUoX2JvdW5kcyk7XG59O1xuXG5cblJlZ2lvbi5wcm90b3R5cGUuZHJhd0J1aWxkID0gZnVuY3Rpb24oX2JvdW5kcykge1xuXHRyZXR1cm4gW107XG59O1xuXG5cblJlZ2lvbi5wcm90b3R5cGUuZHJhd1Bvc2l0aW9uID0gZnVuY3Rpb24oX2JvdW5kcywgX21hdHJpeCkge1xuXHR2YXIgc2NhbGluZyA9IF9tYXRyaXguc2NhbGluZztcblx0dmFyIHJlY3QgPSBuZXcgcGFwZXIuUmVjdGFuZ2xlKC0wLjUsIC0wLjUsIDEsIDEpOyAvLy5zY2FsZSgxL3NjYWxpbmcueCwgMS9zY2FsaW5nLnkpXG5cdHJldHVybiBuZXcgcGFwZXIuUGF0aC5FbGxpcHNlKHJlY3Quc2NhbGUoMS9zY2FsaW5nLngsIDEvc2NhbGluZy55KSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciBDb250ZXh0ID0gcmVxdWlyZSgnLi4vQ29udGV4dC5qcycpO1xudmFyIFJlZ2lvbiA9IHJlcXVpcmUoJy4vUmVnaW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVnaW9uR3JpZDtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gUmVnaW9uR3JpZFxuXG5mdW5jdGlvbiBSZWdpb25HcmlkKF9kYXRhLCBfcGFyZW50KSB7XG5cdFJlZ2lvbi5jYWxsKHRoaXMsIF9kYXRhLCBfcGFyZW50KTtcblx0dGhpcy50eXBlID0gXCJSZWdpb25HcmlkXCI7XG5cdHRoaXMuc3BlY2lmaWVkQ2hpbGRyZW4gPSB1bmRlZmluZWQ7XG59XG5cblJlZ2lvbkdyaWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWdpb24ucHJvdG90eXBlKTtcblJlZ2lvbkdyaWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmVnaW9uR3JpZDtcblxuXG5cblJlZ2lvbkdyaWQucHJvdG90eXBlLnByZXZpZXcgPSBmdW5jdGlvbihfcGFyZW50Q29udGV4dCkge1xuXHR2YXIgY29udGV4dCA9IF9wYXJlbnRDb250ZXh0LmRlcml2ZUNvbnRleHQodGhpcy5wcm9wZXJ0aWVzKTtcblxuXHR0aGlzLnByZXZpZXdCb3VuZHNHcm91cCA9IG5ldyBwYXBlci5Hcm91cCgpO1xuXHR0aGlzLnByZXZpZXdQb3NpdGlvbkdyb3VwID0gbmV3IHBhcGVyLkdyb3VwKCk7XG5cblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25Nb3VzZUVudGVyID0gXy5iaW5kKHRoaXMub25Nb3VzZUVudGVyLCB0aGlzKTtcblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25Nb3VzZUxlYXZlID0gXy5iaW5kKHRoaXMub25Nb3VzZUxlYXZlLCB0aGlzKTtcblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25DbGljayA9IF8uYmluZCh0aGlzLm9uQ2xpY2ssIHRoaXMpO1xuXG5cblx0aWYgKCF0aGlzLnNwZWNpZmllZENoaWxkcmVuKSB7XG5cdFx0dGhpcy5nZW5lcmF0ZUNoaWxkcmVuKGNvbnRleHQpO1xuXHR9XG5cdF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuXHRcdGNoaWxkLnByZXZpZXcoY2hpbGQuY29udGV4dCk7XG5cdH0sIHRoaXMpO1xuXG5cdHRoaXMuc2V0U3R5bGUoXCJkZWZhdWx0XCIpO1xufTtcblxuUmVnaW9uR3JpZC5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbihfcGFyZW50Q29udGV4dCkge1xuXHR2YXIgY29udGV4dCA9IF9wYXJlbnRDb250ZXh0LmRlcml2ZUNvbnRleHQodGhpcy5wcm9wZXJ0aWVzKTtcblxuXG5cblx0aWYgKCF0aGlzLnNwZWNpZmllZENoaWxkcmVuKSB7XG5cdFx0dGhpcy5nZW5lcmF0ZUNoaWxkcmVuKGNvbnRleHQpO1xuXHR9XG5cblx0dmFyIGNoaWxkUGF0aHMgPSBbXTtcblx0Xy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG5cdFx0Y2hpbGRQYXRocyA9IGNoaWxkUGF0aHMuY29uY2F0KGNoaWxkLmJ1aWxkQ2hpbGRyZW4oY2hpbGQuY29udGV4dCkpO1xuXHR9LCB0aGlzKTtcblxuXG5cblx0Ly8gdmFyIGdyaWRDb250ZXh0cyA9IHRoaXMuZ2VuZXJhdGVDb250ZXh0cyhjb250ZXh0KTtcblx0Ly8gdmFyIGNoaWxkUGF0aHMgPSBbXTtcblx0Ly8gXy5lYWNoKGdyaWRDb250ZXh0cywgZnVuY3Rpb24oZ3JpZENvbnRleHQpIHtcblx0Ly8gXHRjaGlsZFBhdGhzID0gY2hpbGRQYXRocy5jb25jYXQodGhpcy5idWlsZENoaWxkcmVuKGdyaWRDb250ZXh0KSk7XG5cdC8vIH0sIHRoaXMpO1xuXG5cdHJldHVybiBjaGlsZFBhdGhzO1xufTtcblxuUmVnaW9uR3JpZC5wcm90b3R5cGUuZ2VuZXJhdGVDaGlsZHJlbiA9IGZ1bmN0aW9uKF9jb250ZXh0KSB7XG5cdHRoaXMuc3BlY2lmaWVkQ2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuXHR0aGlzLmNoaWxkcmVuID0gW107XG5cblx0dmFyIGdyaWRDb250ZXh0cyA9IHRoaXMuZ2VuZXJhdGVDb250ZXh0cyhfY29udGV4dCk7XG5cblx0dmFyIGkgPSAwO1xuXHRfLmVhY2goZ3JpZENvbnRleHRzLCBmdW5jdGlvbihncmlkQ29udGV4dCkge1xuXHRcdHZhciBncmlkQ2hpbGQgPSBuZXcgUmVnaW9uKCk7XG5cdFx0Z3JpZENoaWxkLnBhcmVudCA9IHRoaXM7XG5cdFx0Z3JpZENoaWxkLmVkaXRvclByb3BlcnRpZXMgPSB0aGlzLmVkaXRvclByb3BlcnRpZXM7XG5cdFx0Z3JpZENoaWxkLnByb3BlcnRpZXMubmFtZSA9IHRoaXMucHJvcGVydGllcy5uYW1lICsgXCJfXCIgKyBpKys7XG5cdFx0Xyh0aGlzLnNwZWNpZmllZENoaWxkcmVuKS5lYWNoKGZ1bmN0aW9uKF9jaGlsZCkge1xuXHRcdFx0dmFyIHByb3h5ID0gX2NoaWxkLnByb3h5KCk7XG5cdFx0XHRwcm94eS5wYXJlbnQgPSBncmlkQ2hpbGQ7XG5cdFx0XHRncmlkQ2hpbGQuY2hpbGRyZW4ucHVzaChwcm94eSk7XG5cdFx0fSwgdGhpcyk7XG5cblx0XHRncmlkQ2hpbGQuY29udGV4dCA9IGdyaWRDb250ZXh0O1xuXHRcdHRoaXMuY2hpbGRyZW4ucHVzaChncmlkQ2hpbGQpO1xuXHRcdC8vIGdyaWRDaGlsZC5wcmV2aWV3KGdyaWRDb250ZXh0KTtcblx0fSwgdGhpcyk7XG59O1xuXG5SZWdpb25HcmlkLnByb3RvdHlwZS5nZW5lcmF0ZUNvbnRleHRzID0gZnVuY3Rpb24oX2dyaWRDb250ZXh0KSB7XG5cdC8vIGNhbGN1bGF0ZSByb3dzL2NvbHMgdG8gZHJhd1xuXHR2YXIgcm93cyA9IDE7XG5cdHJvd3MgPSB0aGlzLnByb3BlcnRpZXMucm93cyB8fCByb3dzO1xuXHRyb3dzID0gKF9ncmlkQ29udGV4dC5ib3VuZHMuaGVpZ2h0IC8gdGhpcy5wcm9wZXJ0aWVzLnJvd19oZWlnaHQpIHx8IHJvd3M7XG5cblx0dmFyIGNvbHMgPSAxO1xuXHRjb2xzID0gdGhpcy5wcm9wZXJ0aWVzLmNvbHVtbnMgfHwgY29scztcblx0Y29scyA9IChfZ3JpZENvbnRleHQuYm91bmRzLndpZHRoIC8gdGhpcy5wcm9wZXJ0aWVzLmNvbHVtbl93aWR0aCkgfHwgY29scztcblxuXHR2YXIgZ2VuZXJhdGVkQ29udGV4dHMgPSBbXTtcblxuXHRmb3IgKHZhciByb3cgPSAwOyByb3cgPCByb3dzOyByb3crKykge1xuXHRcdGZvciAodmFyIGNvbCA9IDA7IGNvbCA8IGNvbHM7IGNvbCsrKSB7XG5cblx0XHRcdC8vIGdlbmVyYXRlIGJvdW5kc1x0XHRcdFxuXHRcdFx0dmFyIHdpZHRoID0gX2dyaWRDb250ZXh0LmJvdW5kcy53aWR0aCAvIGNvbHM7XG5cdFx0XHR2YXIgaGVpZ2h0ID0gX2dyaWRDb250ZXh0LmJvdW5kcy5oZWlnaHQgLyByb3dzO1xuXHRcdFx0dmFyIHggPSBfZ3JpZENvbnRleHQuYm91bmRzLmxlZnQgKyBjb2wgKiB3aWR0aDtcblx0XHRcdHZhciB5ID0gX2dyaWRDb250ZXh0LmJvdW5kcy50b3AgKyByb3cgKiBoZWlnaHQ7XG5cblx0XHRcdHZhciBncmlkUmVjdGFuZ2xlID0gbmV3IHBhcGVyLlJlY3RhbmdsZShcblx0XHRcdFx0bmV3IHBhcGVyLlBvaW50KHgsIHkpLFxuXHRcdFx0XHRuZXcgcGFwZXIuU2l6ZSh3aWR0aCwgaGVpZ2h0KVxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gZ2VuZXJhdGUgY29udGV4dFxuXHRcdFx0dmFyIGdyaWRDb250ZXh0ID0gbmV3IENvbnRleHQoZ3JpZFJlY3RhbmdsZSwgX2dyaWRDb250ZXh0Lm1hdHJpeCk7XG5cdFx0XHRpZiAodGhpcy5wcm9wZXJ0aWVzLnJlZ2lzdHJhdGlvbiA9PT0gXCJjZW50ZXJcIikge1xuXHRcdFx0XHRncmlkQ29udGV4dC5jZW50ZXJSZWdpc3RyYXRpb24oKTtcblx0XHRcdH1cblxuXHRcdFx0Z2VuZXJhdGVkQ29udGV4dHMucHVzaChncmlkQ29udGV4dCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGdlbmVyYXRlZENvbnRleHRzO1xuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cy5SZWdpb24gPSByZXF1aXJlKCcuL1JlZ2lvbi5qcycpO1xubW9kdWxlLmV4cG9ydHMuRG9jdW1lbnQgPSByZXF1aXJlKCcuL0RvY3VtZW50LmpzJyk7XG5tb2R1bGUuZXhwb3J0cy5SZWN0YW5nbGUgPSByZXF1aXJlKCcuL1JlY3RhbmdsZS5qcycpO1xubW9kdWxlLmV4cG9ydHMuRWxsaXBzZSA9IHJlcXVpcmUoJy4vRWxsaXBzZS5qcycpO1xubW9kdWxlLmV4cG9ydHMuUmVnaW9uR3JpZCA9IHJlcXVpcmUoJy4vUmVnaW9uR3JpZC5qcycpO1xuXG4iLCIndXNlIHN0cmljdCc7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMuZmlsZVVSTCA9IFwiLi4veWFtbC9yZWdpc3RyYXRpb24ueWFtbFwiO1xubW9kdWxlLmV4cG9ydHMucHJldmlld0NhbnZhc1dpZHRoID0gMTIwMDtcbm1vZHVsZS5leHBvcnRzLnByZXZpZXdDYW52YXNIZWlnaHQgPSAxMjAwO1xubW9kdWxlLmV4cG9ydHMuaW5zcGVjdE9uSG92ZXIgPSBmYWxzZTtcblxuXG5cbi8vY29sb3JzXG52YXIgc2hhcGVGaWxsQ29sb3IgPSBuZXcgcGFwZXIuQ29sb3IoMC42LCAxLjAsIDAuMiwgMC41KTtcbnZhciBzaGFwZVN0cm9rZUNvbG9yID0gbmV3IHBhcGVyLkNvbG9yKFwiIzczODM0M1wiKTtcbnZhciBib3VuZHNTdHJva2VDb2xvciA9IG5ldyBwYXBlci5Db2xvcihcIiMzZWUxZmZcIik7XG52YXIgaGlnaGxpZ2h0Q29sb3IgPSBuZXcgcGFwZXIuQ29sb3IoXCIjZjkyNzcyXCIpO1xuXG4vLyBDcmVhdGUgRGVmYXVsdCBTdHlsZVxudmFyIGRlZmF1bHRTdHlsZSA9IHtcblx0c3Ryb2tlU2NhbGluZzogZmFsc2UsXG5cdHN0cm9rZUNvbG9yOiBcImJsYWNrXCIsXG5cdHN0cm9rZVdpZHRoOiAxLFxuXHRmaWxsQ29sb3I6IG5ldyBwYXBlci5Db2xvcigwLCAwLCAwLCAwKSxcblx0ZGFzaEFycmF5OiBbXVxufTtcblxudmFyIGRlZmF1bHRTdHlsZXMgPSB7fTtcbmRlZmF1bHRTdHlsZXMuZGVmYXVsdCA9IF8oZGVmYXVsdFN0eWxlKS5jbG9uZSgpO1xuZGVmYXVsdFN0eWxlcy5zZWxlY3RlZCA9IF8oZGVmYXVsdFN0eWxlKS5jbG9uZSgpO1xuZGVmYXVsdFN0eWxlcy5rZXkgPSBfKGRlZmF1bHRTdHlsZSkuY2xvbmUoKTtcbmRlZmF1bHRTdHlsZXMuZ2hvc3QgPSBfKGRlZmF1bHRTdHlsZSkuY2xvbmUoKTtcbmRlZmF1bHRTdHlsZXMuaG92ZXIgPSBfKGRlZmF1bHRTdHlsZSkuY2xvbmUoKTtcblxuXG4vLyBDcmVhdGUgQnVpbGQgU3R5bGVcbnZhciBidWlsZFN0eWxlID0gXyhkZWZhdWx0U3R5bGUpLmNsb25lKCk7XG5fKGJ1aWxkU3R5bGUpLmV4dGVuZCh7XG5cdGZpbGxDb2xvcjogc2hhcGVGaWxsQ29sb3IsXG5cdHN0cm9rZUNvbG9yOiB1bmRlZmluZWRcbn0pO1xuXG4vLyBDcmVhdGUgRXhwb3J0IFN0eWxlXG52YXIgZXhwb3J0U3R5bGUgPSBfKGRlZmF1bHRTdHlsZSkuY2xvbmUoKTtcbl8oZXhwb3J0U3R5bGUpLmV4dGVuZCh7fSk7XG5cblxuLy8gQ3JlYXRlIFByZXZpZXcvRnJhbWUgU3R5bGUgLSBCb3VuZHNcbnZhciBzdHlsZXMgPSB7fTtcbnN0eWxlcy5ib3VuZHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdFN0eWxlcyk7XG5fKHN0eWxlcy5ib3VuZHMuZGVmYXVsdCkuZXh0ZW5kKHtcblx0c3Ryb2tlQ29sb3I6IGJvdW5kc1N0cm9rZUNvbG9yXG59KTtcbl8oc3R5bGVzLmJvdW5kcy5zZWxlY3RlZCkuZXh0ZW5kKHtcblx0c3Ryb2tlQ29sb3I6IGhpZ2hsaWdodENvbG9yLFxuXHRzdHJva2VXaWR0aDogMVxufSk7XG5fKHN0eWxlcy5ib3VuZHMua2V5KS5leHRlbmQoe1xuXHRzdHJva2VDb2xvcjogaGlnaGxpZ2h0Q29sb3IsXG5cdHN0cm9rZVdpZHRoOiAzXG59KTtcbl8oc3R5bGVzLmJvdW5kcy5naG9zdCkuZXh0ZW5kKHt9KTtcbl8oc3R5bGVzLmJvdW5kcy5ob3ZlcikuZXh0ZW5kKHtcblx0c3Ryb2tlQ29sb3I6IFwiYmxhY2tcIixcblx0c3Ryb2tlV2lkdGg6IDNcbn0pO1xuXG4vLyBDcmVhdGUgUHJldmlldy9GcmFtZSBTdHlsZSAtIFNoYXBlXG5zdHlsZXMuc2hhcGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc3R5bGVzLmJvdW5kcyk7XG5fKHN0eWxlcy5zaGFwZS5kZWZhdWx0KS5leHRlbmQoe1xuXHRzdHJva2VDb2xvcjogc2hhcGVTdHJva2VDb2xvcixcbn0pO1xuXyhzdHlsZXMuc2hhcGUuc2VsZWN0ZWQpLmV4dGVuZCh7fSk7XG5fKHN0eWxlcy5zaGFwZS5rZXkpLmV4dGVuZCh7fSk7XG5fKHN0eWxlcy5zaGFwZS5naG9zdCkuZXh0ZW5kKHt9KTtcbl8oc3R5bGVzLnNoYXBlLmhvdmVyKS5leHRlbmQoe30pO1xuXG4vLyBDcmVhdGUgUHJldmlldy9GcmFtZSBTdHlsZSAtIFNoYXBlXG5zdHlsZXMucG9zaXRpb24gPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdFN0eWxlcyk7XG5cblxubW9kdWxlLmV4cG9ydHMuc3R5bGVzID0gc3R5bGVzO1xubW9kdWxlLmV4cG9ydHMuZXhwb3J0U3R5bGUgPSBleHBvcnRTdHlsZTtcbm1vZHVsZS5leHBvcnRzLmJ1aWxkU3R5bGUgPSBidWlsZFN0eWxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2c7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBMb2dcblxuZnVuY3Rpb24gTG9nKCkge1xuXG5cdHRoaXMuZGVidWdUZW1wbGF0ZSA9XG5cdFx0Xy50ZW1wbGF0ZSgnPGxpIGNsYXNzID0gXCJkZWJ1Z1wiPjxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSBtZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblx0dGhpcy5zdWNjZXNzVGVtcGxhdGUgPVxuXHRcdF8udGVtcGxhdGUoJzxsaSBjbGFzcyA9IFwic3VjY2Vzc1wiPjxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSBtZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblx0dGhpcy5tZXNzYWdlVGVtcGxhdGUgPVxuXHRcdF8udGVtcGxhdGUoJzxsaSBjbGFzcyA9IFwibWVzc2FnZVwiPjxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSBtZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblx0dGhpcy53YXJuaW5nVGVtcGxhdGUgPVxuXHRcdF8udGVtcGxhdGUoJzxsaSBjbGFzcyA9IFwid2FybmluZ1wiPjxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSBtZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblx0dGhpcy5lcnJvclRlbXBsYXRlID1cblx0XHRfLnRlbXBsYXRlKCc8bGkgY2xhc3MgPSBcImVycm9yXCI+PHNwYW4gY2xhc3M9XCJtZXNzYWdlXCI+PCU9IG1lc3NhZ2UgJT48L3NwYW4+PC9saT4nKTtcblxuXHR0aGlzLnBhcnNlRXJyb3JUZW1wbGF0ZSA9XG5cdFx0Xy50ZW1wbGF0ZSgnPGxpIGNsYXNzID0gXCJlcnJvclwiPjxzcGFuIGNsYXNzPVwibGluZVwiPkxpbmUgPCU9IG1hcmsubGluZSArIDEgJT48L3NwYW4+IDxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSByZWFzb24gJT48L3NwYW4+PC9saT4nKTtcblxuXHR0aGlzLmV4Y2VwdGlvblRlbXBsYXRlID1cblx0XHRfLnRlbXBsYXRlKCc8bGkgY2xhc3MgPSBcImVycm9yXCI+PHNwYW4gY2xhc3M9XCJtZXNzYWdlXCI+PCU9IG1lc3NhZ2UgJT48YnIgLz5FeGNlcHRpb24gb2NjdXJyZWQ6ICA8JT0gZS5tZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblxufVxuXG52YXIgc2hhcmVkO1xuTG9nLnNoYXJlZEluc3RhbmNlID0gZnVuY3Rpb24oKSB7XG5cdHNoYXJlZCA9IHNoYXJlZCB8fCBuZXcgTG9nKCk7IFxuXHRyZXR1cm4gc2hhcmVkO1xufTtcblxuTG9nLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKF9tZXNzYWdlKSB7XG5cdCQoXCIjbG9nXCIpLmVtcHR5KCk7XG59O1xuXG5mdW5jdGlvbiBzdHJpbmdBcmd1bWVudHMoX2FyZ3VtZW50cykge1xuXHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKF9hcmd1bWVudHMpO1xuXHRyZXR1cm4gYXJncy5qb2luKFwiIFwiKTtcbn1cblxuTG9nLnByb3RvdHlwZS5hcHBlbmREZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuXHQkKFwiI2xvZ1wiKS5hcHBlbmQodGhpcy5kZWJ1Z1RlbXBsYXRlKHtcblx0XHRtZXNzYWdlOiBzdHJpbmdBcmd1bWVudHMoYXJndW1lbnRzKVxuXHR9KSk7XG5cdHZhciBkID0gJCgnI2xvZycpO1xuXHRkLnNjcm9sbFRvcChkLnByb3AoXCJzY3JvbGxIZWlnaHRcIikpO1xuXG59O1xuXG5Mb2cucHJvdG90eXBlLmFwcGVuZFN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcblx0JChcIiNsb2dcIikuYXBwZW5kKHRoaXMuc3VjY2Vzc1RlbXBsYXRlKHtcblx0XHRtZXNzYWdlOiBzdHJpbmdBcmd1bWVudHMoYXJndW1lbnRzKVxuXHR9KSk7XG59O1xuXG5Mb2cucHJvdG90eXBlLmFwcGVuZE1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcblx0JChcIiNsb2dcIikuYXBwZW5kKHRoaXMubWVzc2FnZVRlbXBsYXRlKHtcblx0XHRtZXNzYWdlOiBzdHJpbmdBcmd1bWVudHMoYXJndW1lbnRzKVxuXHR9KSk7XG59O1xuXG5Mb2cucHJvdG90eXBlLmFwcGVuZFdhcm5pbmcgPSBmdW5jdGlvbigpIHtcblx0JChcIiNsb2dcIikuYXBwZW5kKHRoaXMud2FybmluZ1RlbXBsYXRlKHtcblx0XHRtZXNzYWdlOiBzdHJpbmdBcmd1bWVudHMoYXJndW1lbnRzKVxuXHR9KSk7XG59O1xuXG5Mb2cucHJvdG90eXBlLmFwcGVuZEVycm9yID0gZnVuY3Rpb24oKSB7XG5cdCQoXCIjbG9nXCIpLmFwcGVuZCh0aGlzLmVycm9yVGVtcGxhdGUoe1xuXHRcdG1lc3NhZ2U6IHN0cmluZ0FyZ3VtZW50cyhhcmd1bWVudHMpXG5cdH0pKTtcbn07XG5cbkxvZy5wcm90b3R5cGUuYXBwZW5kUGFyc2VFcnJvciA9IGZ1bmN0aW9uKF9ZQU1MRXhjZXB0aW9uKSB7XG5cdCQoXCIjbG9nXCIpLmFwcGVuZCh0aGlzLnBhcnNlRXJyb3JUZW1wbGF0ZShfWUFNTEV4Y2VwdGlvbikpO1xuXHQvL3RvZG8gYWRkIGNsaWNrIHRvIHRoaXNcbn07XG5cbkxvZy5wcm90b3R5cGUuYXBwZW5kRXhjZXB0aW9uID0gZnVuY3Rpb24oX2UsIF9tZXNzYWdlKSB7XG5cblx0JChcIiNsb2dcIikuYXBwZW5kKHRoaXMuZXhjZXB0aW9uVGVtcGxhdGUoe2U6IF9lLCBtZXNzYWdlOiBfbWVzc2FnZX0pKTtcblx0Ly90b2RvIGFkZCBjbGljayB0byB0aGlzXG59O1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb250ZXh0ID0gcmVxdWlyZSgnLi4vQ29udGV4dC5qcycpO1xudmFyIGxhbmd1YWdlID0gcmVxdWlyZSgnLi4vbGFuZ3VhZ2UuanMnKTtcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL3NldHRpbmdzLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJldmlldztcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gUHJldmlld1xuXG5mdW5jdGlvbiBQcmV2aWV3KCkge1xuXHR0aGlzLnByZXZpZXdMYXllciA9IG51bGw7XG5cdHRoaXMuYnVpbGRMYXllciA9IG51bGw7XG5cdHRoaXMuZXhwb3J0TGF5ZXIgPSBudWxsO1xuXG5cdHRoaXMuZG9jID0gbnVsbDtcblxuXG5cdHZhciBzZWxmID0gdGhpcztcblx0JC5Ub3BpYyhcIlVJL2NvbW1hbmQvdG9nZ2xlVmlld1ByZXZpZXdcIikuc3Vic2NyaWJlKFxuXHRcdGZ1bmN0aW9uKF9zdGF0ZSkge1xuXHRcdFx0aWYgKF9zdGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdF9zdGF0ZSA9ICFzZWxmLnByZXZpZXdMYXllci52aXNpYmxlO1xuXHRcdFx0fVxuXHRcdFx0c2VsZi5wcmV2aWV3TGF5ZXIudmlzaWJsZSA9IF9zdGF0ZTtcblx0XHRcdHBhcGVyLnZpZXcudXBkYXRlKCk7XG5cdFx0fVxuXHQpO1xuXHQkLlRvcGljKFwiVUkvY29tbWFuZC90b2dnbGVWaWV3QnVpbGRcIikuc3Vic2NyaWJlKFxuXHRcdGZ1bmN0aW9uKF9zdGF0ZSkge1xuXHRcdFx0aWYgKF9zdGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdF9zdGF0ZSA9ICFzZWxmLmJ1aWxkTGF5ZXIudmlzaWJsZTtcblx0XHRcdH1cblx0XHRcdHNlbGYuYnVpbGRMYXllci52aXNpYmxlID0gX3N0YXRlO1xuXHRcdFx0cGFwZXIudmlldy51cGRhdGUoKTtcblx0XHR9XG5cdCk7XG5cdCQuVG9waWMoXCJVSS9jb21tYW5kL3RvZ2dsZVZpZXdFeHBvcnRcIikuc3Vic2NyaWJlKFxuXHRcdGZ1bmN0aW9uKF9zdGF0ZSkge1xuXHRcdFx0aWYgKF9zdGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdF9zdGF0ZSA9ICFzZWxmLmV4cG9ydExheWVyLnZpc2libGU7XG5cdFx0XHR9XG5cdFx0XHRzZWxmLmV4cG9ydExheWVyLnZpc2libGUgPSBfc3RhdGU7XG5cdFx0XHRwYXBlci52aWV3LnVwZGF0ZSgpO1xuXHRcdH1cblx0KTtcblxuXG5cbn1cblxuUHJldmlldy5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKF9lbGVtZW50KSB7XG5cdHBhcGVyLnNldHVwKF9lbGVtZW50KTtcblx0dGhpcy5idWlsZExheWVyID0gbmV3IHBhcGVyLkxheWVyKCk7XG5cdHRoaXMuZXhwb3J0TGF5ZXIgPSBuZXcgcGFwZXIuTGF5ZXIoKTtcblx0dGhpcy5wcmV2aWV3TGF5ZXIgPSBuZXcgcGFwZXIuTGF5ZXIoKTtcblxuXHR2YXIgZHJhZyA9IGZhbHNlO1xuXHR2YXIgbGFzdE1vdXNlO1xuXG5cdC8vIGhhbmRsZSBkcmFnZ2luZy9wYW5uaW5nXG5cdCQocGFwZXIudmlldy5lbGVtZW50KS5tb3VzZWRvd24oZnVuY3Rpb24oX2UpIHtcblx0XHRkcmFnID0gdHJ1ZTtcblx0XHRsYXN0TW91c2UgPSBuZXcgcGFwZXIuUG9pbnQoX2Uub3JpZ2luYWxFdmVudC5zY3JlZW5YLCBfZS5vcmlnaW5hbEV2ZW50LnNjcmVlblkpO1xuXHR9KTtcblxuXHQkKHdpbmRvdykubW91c2V1cChmdW5jdGlvbihfZSkge1xuXHRcdGRyYWcgPSBmYWxzZTtcblx0fSk7XG5cblx0JCh3aW5kb3cpLm1vdXNlbW92ZShmdW5jdGlvbihfZSkge1xuXHRcdGlmICghZHJhZykgcmV0dXJuO1xuXHRcdHZhciB0aGlzTW91c2UgPSBuZXcgcGFwZXIuUG9pbnQoX2Uub3JpZ2luYWxFdmVudC5zY3JlZW5YLCBfZS5vcmlnaW5hbEV2ZW50LnNjcmVlblkpO1xuXHRcdHBhcGVyLnZpZXcuc2Nyb2xsQnkobGFzdE1vdXNlLnN1YnRyYWN0KHRoaXNNb3VzZSkpO1xuXHRcdGxhc3RNb3VzZSA9IHRoaXNNb3VzZTtcblx0fSk7XG5cbn07XG5cblByZXZpZXcucHJvdG90eXBlLnNldERvY3VtZW50ID0gZnVuY3Rpb24oX2RvYykge1xuXHR0aGlzLmRvYyA9IF9kb2M7XG5cblx0dmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dCgpO1xuXHR2YXIgdW5pdCA9IGxhbmd1YWdlLnVuaXRTY2FsZXNbdGhpcy5kb2MucHJvcGVydGllcy51bml0XSB8fCAxO1xuXHRjb250ZXh0Lm1hdHJpeC5zY2FsZSh1bml0KTtcblx0Ly8gbW9kdWxlLmV4cG9ydHMuaW5zcGVjdG9yLnNldFVuaXQodGhpcy5kb2MucHJvcGVydGllcy51bml0KTtcblxuXHQvLyBkcmF3IHByZXZpZXcvZnJhbWVcblx0dGhpcy5wcmV2aWV3TGF5ZXIucmVtb3ZlQ2hpbGRyZW4oKTtcblx0cGFwZXIucHJvamVjdC5hY3RpdmVMYXllciA9IHRoaXMucHJldmlld0xheWVyO1xuXHR0aGlzLmRvYy5wcmV2aWV3KGNvbnRleHQpO1xuXG5cdC8vIGRyYXcgYnVpbGRcblx0dGhpcy5idWlsZExheWVyLnJlbW92ZUNoaWxkcmVuKCk7XG5cdHBhcGVyLnByb2plY3QuYWN0aXZlTGF5ZXIgPSB0aGlzLmJ1aWxkTGF5ZXI7XG5cdHRoaXMuZG9jLmJ1aWxkKGNvbnRleHQpO1xuXHR0aGlzLmJ1aWxkTGF5ZXIuc3R5bGUgPSBzZXR0aW5ncy5idWlsZFN0eWxlO1xuXG5cdC8vIGRyYXcgZXhwb3J0XG5cdHRoaXMuZXhwb3J0TGF5ZXIucmVtb3ZlQ2hpbGRyZW4oKTtcblx0cGFwZXIucHJvamVjdC5hY3RpdmVMYXllciA9IHRoaXMuZXhwb3J0TGF5ZXI7XG5cdHRoaXMuZG9jLmJ1aWxkKGNvbnRleHQpO1xuXHR0aGlzLmV4cG9ydExheWVyLnN0eWxlID0gc2V0dGluZ3MuZXhwb3J0U3R5bGU7XG5cblxuXHRwYXBlci52aWV3LmNlbnRlciA9IG5ldyBwYXBlci5Qb2ludChfZG9jLnByb3BlcnRpZXMud2lkdGggKiAwLjUgKiB1bml0LCBfZG9jLnByb3BlcnRpZXMuaGVpZ2h0ICogMC41ICogdW5pdCk7XG5cdHBhcGVyLnZpZXcudXBkYXRlKCk7XG5cbn07XG5cblByZXZpZXcucHJvdG90eXBlLnJlZHJhdyA9IGZ1bmN0aW9uKCkge1xuXHRwYXBlci52aWV3LnVwZGF0ZSgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG5cblxuXG5tb2R1bGUuZXhwb3J0cy5kb3dubG9hZERhdGFVcmkgPSBmdW5jdGlvbihfZmlsZW5hbWUsIF9kYXRhKSB7XG5cdHZhciBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG5cdGxpbmsuZG93bmxvYWQgPSBfZmlsZW5hbWU7XG5cdGxpbmsuaHJlZiA9IF9kYXRhO1xuXHRjb25zb2xlLmxvZyhsaW5rKTtcblx0bGluay5jbGljaygpO1xufTtcblxuXG4vLyBnaXZlbiBhIG9iamVjdCB0cmVlIGFuZCB0aGUgbmFtZSBvZiBhIGtleSB0aGF0IGhvbGRzIGFuIGFycmF5IG9mIGNoaWxkcmVuIGluIGVhY2ggb2JqZWN0LCByZXR1cm5zIGEgZmxhdCBhcnJheSBvZiBhbGwgZGVjZW5kYW50c1xubW9kdWxlLmV4cG9ydHMuY29sbGVjdFRyZWUgPSBmdW5jdGlvbihfbm9kZSwgX2tleSkge1xuXHR2YXIgYyA9IFtfbm9kZV07XG5cdF8oX25vZGVbX2tleV0pLmVhY2goXG5cdFx0ZnVuY3Rpb24oX2NoaWxkTm9kZSkge1xuXHRcdFx0YyA9IGMuY29uY2F0KG1vZHVsZS5leHBvcnRzLmNvbGxlY3RUcmVlKF9jaGlsZE5vZGUsIF9rZXkpKTtcblx0XHR9XG5cdCk7XG5cdHJldHVybiBjO1xufTtcblxuXG4vLyBnaXZlbiB0d28gYXJyYXlzIG9mIG9iamVjdHMsIGFkZHMgb2JqZWN0cyBmcm9tIF9uZXcgdG8gX2Jhc2UgcmVwbGFjaW5nIG9iamVjdHMgd2l0aCBtYXRjaGluZyBfa2V5IHByb3BlcnR5LCByZXR1cm5zIHJlc3VsdHNcbi8vIGRvZXMgbm90IHByZXNlcnZlIG9yZGVyXG4vLyBbe25hbWU6IGFiZSwgYWdlOiAzMH0sIHtuYW1lOiBiZXRoLCBhZ2U6IDMwfV0gLCBbe25hbWU6IGFiZSwgYWdlOiAzMX0sIHtuYW1lOiBjYXRoeSwgYWdlOiAyNn1dLCBcIm5hbWVcIlxuLy8gW3tuYW1lOiBiZXRoLCBhZ2U6IDMwfSwge25hbWU6IGFiZSwgYWdlOiAzMX0sIHtuYW1lOiBjYXRoeSwgYWdlOiAyNn1dXG5cbm1vZHVsZS5leHBvcnRzLm1lcmdlT2JqZWN0QXJyYXlzT25LZXkgPSBmdW5jdGlvbihfYmFzZSwgX25ldywgX2tleSkge1xuXHRcblx0X2Jhc2UgPSBfKF9iYXNlKS5maWx0ZXIoZnVuY3Rpb24oX2Jhc2VPYmplY3Qpe1xuXHRcdHZhciBvdmVycmlkZGVuID0gXyhfbmV3KS5maW5kKCBmdW5jdGlvbihfbmV3T2JqZWN0KSB7XG5cdFx0XHRyZXR1cm4gX25ld09iamVjdFtfa2V5XSA9PT0gX2Jhc2VPYmplY3RbX2tleV07XG5cdFx0fSk7XG5cdFx0cmV0dXJuICFvdmVycmlkZGVuO1xuXHR9KTtcblxuXHRyZXR1cm4gX2Jhc2UuY29uY2F0KF9uZXcpO1xufVxuXG4iXX0=
