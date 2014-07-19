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


},{"./language.js":39,"./ui/Log.js":49,"js-yaml":2,"underscore":34}],37:[function(require,module,exports){
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
	_(data.regionTypes).each(function(type){
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
		// console.log("source", source);
		var data = Parser.parse(source);
		if (!data) return;

		var doc = new regionTypes.Document();
		doc.loadData(data);
		// console.log("doc", data, doc.properties);
		doc.properties.left = 0;
		doc.properties.top = 0;
		doc.properties.width = data.properties.width || 525;
		doc.properties.height = data.properties.height || 225;
		doc.properties.registration = "center";


		var canvas = $("<canvas>")
			.addClass("example")
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

},{"./Parser.js":36,"./jquery_util.js":38,"./language.js":39,"./region/regionTypes.js":47,"./ui/Preview.js":50,"mustache":33,"underscore":34}],38:[function(require,module,exports){
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

// module.exports.combinePaths = function(_paths, _operation) {
// 	if (_paths.length < 1) return [];

	
// 	var newPath = _paths[0];
// 	for (var i = 1; i < _paths.length; i++) {
// 		newPath.remove();
// 		_paths[i].remove();
// 		newPath = newPath[_operation](_paths[i]);
// 	}

// 	return newPath;
// };

module.exports.newCombinePaths = function(_basePath, _paths, _operation){
	if (_paths.length < 1) return [_basePath];

	_resultPath = _basePath;
	for (var i = 0; i < _paths.length; i++) {
		if (!(_paths[i] instanceof paper.Path)) continue;

		_resultPath.remove();
		_paths[i].remove();
		_resultPath = _resultPath[_operation](_paths[i]);
	}

	return _resultPath;

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


},{"../util.js":51,"./Region.js":44}],42:[function(require,module,exports){
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

	// if (typeof _data.properties === "object" && _data.properties !== null) {
	this.loadProperties(_data.properties);
	// }

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


	if (typeof _properties === 'undefined') {
		_properties = {};
	}
	if (typeof _properties !== 'object') {
		log.appendWarning(messagePrefix + "Properties should be a key/value map. " +
			"<br />Received " + typeof _properties + ".");
		_properties = {};
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
	if (!(_childrenData instanceof Array)) {
		log.appendWarning("Children should be an array. Prepend child nodes with a dash and space.");
		return;
	}
	_.each(_childrenData, function(_childData) {
		var childKey = _.keys(_childData)[0];
		var childData = _.values(_childData)[0];
		if (typeof childKey === "undefined" || typeof childData === "undefined") {
			log.appendWarning("Undefined Child");
			return;
		}

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

	
	// build own paths
	var ownPaths = [].concat(this.drawBuild(context.bounds));
	_.each(ownPaths, function(p) {
		p.transform(context.matrix);
	}, this);
	

	// collect child paths/ops
	var childPathSets = [];
	var childOps = [];
	_.each(this.children, function(_child) {
		var s = _child.build(context);
		childPathSets.push(s);
		childOps.push(booleanOperations[_child.properties.boolean]);
	});


	// arrange operands
	var leftPathSet = ownPaths;
	var rightPathSets = childPathSets;
	var ops = childOps;
	var resultPaths = [];

	if (ownPaths.length === 0) {
		leftPathSet = rightPathSets.splice(0, 1)[0];
		ops.splice(0, 1);
	}

	
	// filter out non booleanable paths (skips)
	var skips = _(leftPathSet).filter(function(_path) {
		return !(_path instanceof paper.Path || _path instanceof paper.CompoundPath);
	});
	resultPaths = resultPaths.concat(skips);
	leftPathSet = _(leftPathSet).difference(skips);

	_(rightPathSets).each(function(pathSet, pathSetIndex) {
		skips = _(pathSet).filter(function(_path) {
			return !(_path instanceof paper.Path || _path instanceof paper.CompoundPath);
		});
		resultPaths = resultPaths.concat(skips);
		rightPathSets[pathSetIndex] = _(pathSet).difference(skips);
	});


	// process the booleans
	_(leftPathSet).each(function(leftPath, leftIndex) {
		_(rightPathSets).each(function(rightPathSet, rightIndex) {
			if (typeof ops[rightIndex] === 'undefined') {
				resultPaths = resultPaths.concat(rightPathSet);
				return;
			}
			var boolResult = this._combinePaths(leftPathSet[leftIndex], rightPathSet, ops[rightIndex]);
			leftPathSet[leftIndex] = boolResult;
		}, this);
	}, this);


	resultPaths = resultPaths.concat(leftPathSet);

	return resultPaths;

};


Region.prototype._combinePaths = function(_leftPath, _rightPathSet, _op) {

	if (_rightPathSet.length < 1) return _leftPath;
	// if (typeof _op === 'undefined') return _leftPath;
	
	_(_rightPathSet).each( function (_rightPath) {
		_leftPath.remove();
		_rightPath.remove();
		try {
			_leftPath = _leftPath[_op](_rightPath);
		} catch(e) {
			log.appendWarning("Failed to resolve boolean opperation.");
			console.warn(e);// throw(e);
		}
	});
	return _leftPath;
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
	}
	else {
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
	return new paper.Path.Ellipse(rect.scale(1 / scaling.x, 1 / scaling.y));
};

},{"../Context.js":35,"../language.js":39,"../paper_util.js":40,"../settings.js":48,"../ui/Log.js":49,"../util.js":51,"./regionTypes.js":47,"underscore":34}],45:[function(require,module,exports){
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

	var width = _gridContext.bounds.width / cols;
	var height = _gridContext.bounds.height / rows;
	var baseX = _gridContext.bounds.left;
	var baseY = _gridContext.bounds.top;

	if (this.properties.column_align === 'right') {
		baseX = _gridContext.bounds.right - width * Math.floor(cols);
	}
	if (this.properties.column_align === 'center') {
		baseX = _gridContext.bounds.center.x - width * Math.floor(cols) * 0.5;
	}
	if (this.properties.row_align === 'bottom') {
		baseY = _gridContext.bounds.bottom - height * Math.floor(rows);
	}
	if (this.properties.row_align === 'center') {
		baseY = _gridContext.bounds.center.y - height * Math.floor(rows) * 0.5;
	}

	var generatedContexts = [];

	for (var row = 0; row < Math.floor(rows); row++) {
		for (var col = 0; col < Math.floor(cols); col++) {

			// generate bounds			
			
			var x = baseX + col * width;
			var y = baseY + row * height;

			var gridRectangle = new paper.Rectangle(
				new paper.Point(x, y),
				new paper.Size(width, height)
			);

			var gridContext = _gridContext.deriveContext({
				top: y,
				bottom: y+height,
				left: x,
				right: x+width,
				registration: this.properties.registration
			});

			generatedContexts.push(gridContext);
		}
	}

	return generatedContexts;

};

},{"../Context.js":35,"./Region.js":44,"underscore":34}],46:[function(require,module,exports){
'use strict';


var _ = require('underscore');
var Region = require('./Region.js');


module.exports = Text;

var font;

/* global __dirname */
// using browserify and brfs to inline the svg data.
// https://github.com/substack/brfs

var font = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\r\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\r\n<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"30px\"\r\n\t height=\"60px\" viewBox=\"0 0 30 60\" enable-background=\"new 0 0 30 60\" xml:space=\"preserve\">\r\n<g id=\"char-ampersand\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM23.571,36.429C23.571,32.878,26.45,30,30,30h8.571\"/>\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"15\" r=\"15\"/>\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM15,30C6.716,30,0,36.715,0,45c0,8.283,6.716,15,15,15c8.284,0,15-6.717,15-15V30\"/>\r\n</g>\r\n<g id=\"char-exclamation\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"5\" y1=\"40\" x2=\"5\" y2=\"0\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"5\" y1=\"50\" x2=\"5\" y2=\"60\"/>\r\n</g>\r\n<g id=\"char-period\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"60\" x2=\"10\" y2=\"50\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"50\" x2=\"10\" y2=\"60\"/>\r\n</g>\r\n<g id=\"char-question\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"15\" y1=\"50\" x2=\"15\" y2=\"60\"/>\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM15,40V30c8.285,0,15-6.717,15-15c0-8.285-6.715-15-15-15C6.717,0,0,6.715,0,15\"/>\r\n</g>\r\n<g id=\"char-semicolon\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"5\" y1=\"35\" x2=\"5\" y2=\"45\"/>\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM5,55v5c0,2.762-2.238,5-5,5\"/>\r\n</g>\r\n<g id=\"char-colon\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"5\" y1=\"20\" x2=\"5\" y2=\"30\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"5\" y1=\"40\" x2=\"5\" y2=\"50\"/>\r\n</g>\r\n<g id=\"char-tilde\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM24.998,25c0,2.762-2.238,5-5,5H10c-2.762,0-5,2.238-5,5\"/>\r\n</g>\r\n<g id=\"char-comma\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM5,55v5c0,2.762-2.238,5-5,5\"/>\r\n</g>\r\n<g id=\"char-apostrophe\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM10,10V5c0-2.762-2.238-5-5-5\"/>\r\n</g>\r\n<g id=\"char-quote\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"10\" y1=\"0\" x2=\"10\" y2=\"10\"/>\r\n</g>\r\n<g id=\"char-doublequote\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"15\" y1=\"0\" x2=\"15\" y2=\"10\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"10\" y1=\"0\" x2=\"10\" y2=\"10\"/>\r\n</g>\r\n<g id=\"char-dash\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"5\" y1=\"30\" x2=\"25\" y2=\"30\"/>\r\n</g>\r\n<g id=\"char-9\" display=\"none\">\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"15\" r=\"15\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"15\" x2=\"30\" y2=\"60\"/>\r\n</g>\r\n<g id=\"char-8\" display=\"none\">\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"15\" r=\"15\"/>\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n</g>\r\n<g id=\"char-7\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"0\" x2=\"30\" y2=\"0\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"0\" x2=\"0\" y2=\"60\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"5\" y1=\"30\" x2=\"25\" y2=\"30\"/>\r\n</g>\r\n<g id=\"char-6\" display=\"none\">\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM0,45V15C0,6.715,6.717,0,15,0c8.285,0,15,6.715,15,15\"/>\r\n</g>\r\n<g id=\"char-5\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM0,45c0,8.283,6.717,15,15,15c8.285,0,15-6.717,15-15c0-8.285-6.715-15-15-15H0V0h30\"/>\r\n</g>\r\n<g id=\"char-4\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t25,60 25,0 0,30 30,30 \t\"/>\r\n</g>\r\n<g id=\"char-3\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM0,45c0,8.283,6.716,15,15,15s15-6.717,15-15c0-8.285-6.716-15-15-15c8.284,0,15-6.717,15-15c0-8.285-6.716-15-15-15S0,6.715,0,15\"\r\n\t\t/>\r\n</g>\r\n<g id=\"char-2\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,60H0l27.457-36.646C29.062,20.967,30,18.093,30,15c0-8.285-6.716-15-15-15S0,6.715,0,15\"/>\r\n</g>\r\n<g id=\"char-1\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t15,0 0,10 15,0 15,60 0,60 30,60 \t\"/>\r\n</g>\r\n<g id=\"char-0\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,45V15c0-8.284-6.716-15-15-15S0,6.716,0,15v30c0,8.284,6.716,15,15,15S30,53.284,30,45z\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"5\" y1=\"5\" x2=\"25\" y2=\"55\"/>\r\n</g>\r\n<g id=\"char-z\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,60 0,60 30,30.333 0,30.333 \t\"/>\r\n</g>\r\n<g id=\"char-y\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"12\" y2=\"60\"/>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"30\" x2=\"0\" y2=\"80\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-x\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"30\" y2=\"60\"/>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"30\" x2=\"0\" y2=\"60\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-w\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM0,30v22.5C0,56.643,3.357,60,7.5,60s7.5-3.357,7.5-7.5c0,4.143,3.357,7.5,7.5,7.5s7.5-3.357,7.5-7.5V30\"/>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"15\" y1=\"52.5\" x2=\"15\" y2=\"45\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-v\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,30 15,60 0,30 \t\"/>\r\n</g>\r\n<g id=\"char-u\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM30,30v15c0,8.285-6.716,15-15,15S0,53.285,0,45V30\"/>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"45\" x2=\"30\" y2=\"60\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-t\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM10,0v50c0,5.522,4.478,10,10,10s10-4.478,10-10\"/>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"30\" y2=\"30\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-s\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM30,37.5c0-4.142-3.357-7.5-7.5-7.5h-15C3.359,30,0,33.358,0,37.5S3.359,45,7.5,45h15c4.143,0,7.5,3.358,7.5,7.5\r\n\t\t\tS26.643,60,22.5,60h-15C3.359,60,0,56.642,0,52.5\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-r\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM30,45c0-8.285-6.716-15-15-15S0,36.715,0,45v15V30\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-q\" display=\"none\">\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,30 30,80 40,70 \t\"/>\r\n</g>\r\n<g id=\"char-p\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<g>\r\n\t\t\t\r\n\t\t\t\t<circle fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n\t\t</g>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"0\" y2=\"80\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-o\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t\r\n\t\t\t<circle fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-n\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM30,60V45c0-8.285-6.717-15-15-15C6.715,30,0,36.715,0,45v15V30\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-m\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<g>\r\n\t\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\t\tM30,60V37.5c0-4.143-3.357-7.5-7.5-7.5S15,33.357,15,37.5c0-4.143-3.357-7.5-7.5-7.5S0,33.357,0,37.5V60\"/>\r\n\t\t\t\r\n\t\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"15\" y1=\"37.5\" x2=\"15\" y2=\"45\"/>\r\n\t\t</g>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"40\" x2=\"0\" y2=\"30\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-l\">\r\n\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM5,0h5c2.762,0,5,2.238,5,5v50c0,2.762,2.238,5,5,5h5\"/>\r\n</g>\r\n<g id=\"char-k\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"45\" x2=\"30\" y2=\"60\"/>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"45\" x2=\"20\" y2=\"30\"/>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"60\" x2=\"0\" y2=\"0\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-j\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"20\" y1=\"25\" x2=\"20\" y2=\"15\"/>\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,30h-5c-2.762,0-5,2.238-5,5v35c0,5.522-4.478,10-10,10S0,75.522,0,70\"/>\r\n</g>\r\n<g id=\"char-i\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"10\" y1=\"25\" x2=\"10\" y2=\"15\"/>\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM0,30h10v20c0,5.522,4.478,10,10,10s10-4.478,10-10\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-h\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,60V45c0-8.285-6.716-15-15-15S0,36.715,0,45v15V0\"/>\r\n</g>\r\n<g id=\"char-g\" display=\"none\">\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,45v20c0,8.283-6.716,15-15,15S0,73.283,0,65\"/>\r\n</g>\r\n<g id=\"char-f\" display=\"none\">\r\n\t<g display=\"inline\">\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM15,30\"/>\r\n\t\t\r\n\t\t\t<line fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"30\" y2=\"30\"/>\r\n\t\t<path fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\t\tM0,60h5c2.762,0,5-2.238,5-5V10c0-5.522,4.478-10,10-10s10,4.478,10,10\"/>\r\n\t</g>\r\n</g>\r\n<g id=\"char-e\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM25.606,55.606C22.678,58.535,18.839,60,15,60C6.716,60,0,53.283,0,45c0-8.285,6.716-15,15-15s15,6.715,15,15H0\"/>\r\n</g>\r\n<g id=\"char-d\" display=\"none\">\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"60\" x2=\"30\" y2=\"0\"/>\r\n</g>\r\n<g id=\"char-c\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM25.606,34.394c-5.858-5.858-15.355-5.858-21.213,0c-5.858,5.857-5.858,15.354,0,21.213c5.856,5.857,15.355,5.858,21.213,0\"/>\r\n</g>\r\n<g id=\"char-b\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"60\" x2=\"0\" y2=\"0\"/>\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n</g>\r\n<g id=\"char-a\" display=\"none\">\r\n\t\r\n\t\t<circle display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" cx=\"15\" cy=\"45\" r=\"15\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"45\" x2=\"30\" y2=\"60\"/>\r\n</g>\r\n<g id=\"char-Z\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,60 0,60 30,0 0,0 \t\"/>\r\n</g>\r\n<g id=\"char-Y\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"0\" x2=\"15\" y2=\"30\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"15\" y1=\"30\" x2=\"30\" y2=\"0\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"15\" y1=\"30\" x2=\"15\" y2=\"60\"/>\r\n</g>\r\n<g id=\"char-X\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"0\" x2=\"30\" y2=\"60\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"60\" x2=\"30\" y2=\"0\"/>\r\n</g>\r\n<g id=\"char-W\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t0,0 0,60 15,10 30,60 30,0 \t\"/>\r\n</g>\r\n<g id=\"char-V\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t0,0 15,60 30,0 \t\"/>\r\n</g>\r\n<g id=\"char-U\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM0,0v45c0,8.284,6.715,15,15,15c8.283,0,15-6.716,15-15V0\"/>\r\n</g>\r\n<g id=\"char-T\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,0 0,0 15,0 15,60 \t\"/>\r\n</g>\r\n<g id=\"char-S\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM0,45c0,8.284,6.716,15,15,15s15-6.716,15-15s-6.716-15-15-15S0,23.284,0,15S6.716,0,15,0s15,6.716,15,15\"/>\r\n</g>\r\n<g id=\"char-R\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM0,30h15c8.284,0,15-6.716,15-15S23.284,0,15,0H0v60\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"30\" y2=\"60\"/>\r\n</g>\r\n<g id=\"char-Q\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,45V15c0-8.284-6.716-15-15-15S0,6.716,0,15v30c0,8.284,6.716,15,15,15S30,53.284,30,45z\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"60\" x2=\"15\" y2=\"45\"/>\r\n</g>\r\n<g id=\"char-P\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM0,30h15c8.285,0,15-6.716,15-15S23.285,0,15,0H0v60\"/>\r\n</g>\r\n<g id=\"char-O\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,45V15c0-8.284-6.715-15-15-15C6.717,0,0,6.716,0,15v30c0,8.284,6.717,15,15,15C23.285,60,30,53.284,30,45z\"/>\r\n</g>\r\n<g id=\"char-N\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t0,60 0,0 30,60 30,0 \t\"/>\r\n</g>\r\n<g id=\"char-M\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,60 30,0 15,50 0,0 0,60 \t\"/>\r\n</g>\r\n<g id=\"char-L\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,60 0,60 0,0 \t\"/>\r\n</g>\r\n<g id=\"char-K\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"60\"/>\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,0 0,30 30,60 \t\"/>\r\n</g>\r\n<g id=\"char-J\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM10,0h20v45c0,8.284-6.716,15-15,15S0,53.284,0,45\"/>\r\n</g>\r\n<g id=\"char-I\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,0 0,0 15,0 15,60 0,60 30,60 \t\"/>\r\n</g>\r\n<g id=\"char-H\" display=\"none\">\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"60\" x2=\"0\" y2=\"0\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"30\" y1=\"60\" x2=\"30\" y2=\"0\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"30\" y2=\"30\"/>\r\n</g>\r\n<g id=\"char-G\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,15c0-8.284-6.715-15-15-15C6.717,0,0,6.716,0,15v30c0,8.284,6.717,15,15,15c8.285,0,15-6.716,15-15V30H10\"/>\r\n</g>\r\n<g id=\"char-F\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t0,60 0,0 30,0 \t\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"10\" y2=\"30\"/>\r\n</g>\r\n<g id=\"char-E\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,60 0,60 0,0 30,0 \t\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"0\" y1=\"30\" x2=\"10\" y2=\"30\"/>\r\n</g>\r\n<g id=\"char-D\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,15c0-8.284-6.716-15-15-15H0v60h15c8.284,0,15-6.716,15-15V15z\"/>\r\n</g>\r\n<g id=\"char-C\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM30,15c0-8.284-6.716-15-15-15S0,6.716,0,15v30c0,8.284,6.716,15,15,15s15-6.716,15-15\"/>\r\n</g>\r\n<g id=\"char-B\" display=\"none\">\r\n\t\r\n\t\t<path display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"\r\n\t\tM15,0c8.283,0,15,6.717,15,15s-6.717,15-15,15c8.283,0,15,6.717,15,15s-6.717,15-15,15H0V0H15z\"/>\r\n</g>\r\n<g id=\"char-A\" display=\"none\">\r\n\t\r\n\t\t<polyline display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" points=\"\r\n\t\t30,60 15,0 0,60 \t\"/>\r\n\t\r\n\t\t<line display=\"inline\" fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" x1=\"22.5\" y1=\"30\" x2=\"7.5\" y2=\"30\"/>\r\n</g>\r\n</svg>\r\n";



// $.ajax({
// 	url: "images/fonts/sutton_30x60.svg",
// 	success: function(_data) {
// 		font = _data;
// 	}
// });

var font_height = 60;
var font_width = 30;
var font_spacing = 15;

var glyphMap = {
'&': "char-ampersand",
'!': "char-exclamation",
'.': "char-period",
'?': "char-question",
';': "char-semicolon",
':': "char-colon",
'~': "char-tilde",
',': "char-comma",
'’': "char-apostrophe",
'\'': "char-quote",
'"': "char-doublequote",
'-': "char-dash",
'9': "char-9",
'8': "char-8",
'7': "char-7",
'6': "char-6",
'5': "char-5",
'4': "char-4",
'3': "char-3",
'2': "char-2",
'1': "char-1",
'0': "char-0",
'z': "char-z",
'y': "char-y",
'x': "char-x",
'w': "char-w",
'v': "char-v",
'u': "char-u",
't': "char-t",
's': "char-s",
'r': "char-r",
'q': "char-q",
'p': "char-p",
'o': "char-o",
'n': "char-n",
'm': "char-m",
'l': "char-l",
'k': "char-k",
'j': "char-j",
'i': "char-i",
'h': "char-h",
'g': "char-g",
'f': "char-f",
'e': "char-e",
'd': "char-d",
'c': "char-c",
'b': "char-b",
'a': "char-a",
'Z': "char-Z",
'Y': "char-Y",
'X': "char-X",
'W': "char-W",
'V': "char-V",
'U': "char-U",
'T': "char-T",
'S': "char-S",
'R': "char-R",
'Q': "char-Q",
'P': "char-P",
'O': "char-O",
'N': "char-N",
'M': "char-M",
'L': "char-L",
'K': "char-K",
'J': "char-J",
'I': "char-I",
'H': "char-H",
'G': "char-G",
'F': "char-F",
'E': "char-E",
'D': "char-D",
'C': "char-C",
'B': "char-B",
'A': "char-A",
};


//////////////////////////////////////////////////////////////////////
// Text

function Text(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Text";
	this.isShape = true;
}

Text.prototype = Object.create(Region.prototype);
Text.prototype.constructor = Text;

Text.prototype.drawBounds = function(_bounds) {

	var textGroup = new paper.Group();

	var scale = this.properties.size / font_height;
	var position = new paper.Point(0, 0);
	if (this.properties.align == 'center') {
		position.x = -(this.properties.text.length * 0.5) * (font_width + font_spacing - 1) * scale;
	}
	if (this.properties.align == 'right') {
		position.x = -(this.properties.text.length) * (font_width + font_spacing - 1) * scale;
	}
	if (this.properties.vertical_align == 'center') {
		position.y = -(font_height * 0.5) * scale;
	}
	if (this.properties.vertical_align == 'bottom') {
		position.y = -(font_height) * scale;
	}

	_(this.properties.text).each(function(c, i) {
		if (c === ' ') return;

		//var glyphID = glyphMap[c.toUpperCase()] || 'char-period';
		var glyphID = glyphMap[c] || 'char-period';
		var glyphSVG = $("#"+glyphID, font).get(0);
		var glyph = new paper.Group();

		glyph.importSVG(glyphSVG, {
			expandShapes: true
		});

		glyph.scale(scale, new paper.Point(0,0));
		glyph.translate(position);
		glyph.translate(i * (font_width + font_spacing) * scale, 0);
		textGroup.addChild(glyph);

	}, this);



	return textGroup;
};


Text.prototype.drawBuild = function(_bounds) {
	
	return this.drawBounds(_bounds);

};

},{"./Region.js":44,"underscore":34}],47:[function(require,module,exports){
'use strict';

module.exports = {};

module.exports.Region = require('./Region.js');
module.exports.Document = require('./Document.js');
module.exports.Rectangle = require('./Rectangle.js');
module.exports.Ellipse = require('./Ellipse.js');
module.exports.RegionGrid = require('./RegionGrid.js');
module.exports.Text = require('./Text.js');


},{"./Document.js":41,"./Ellipse.js":42,"./Rectangle.js":43,"./Region.js":44,"./RegionGrid.js":45,"./Text.js":46}],48:[function(require,module,exports){
'use strict';
var _ = require('underscore');

module.exports.fileURL = "./examples/drawbot.yaml";
// module.exports.fileURL = "../yaml/tricky_grid.yaml";
module.exports.previewCanvasWidth = 1200;
module.exports.previewCanvasHeight = 1200;
module.exports.inspectOnHover = false;



//colors
var shapeFillColor = new paper.Color(0.4, .4, 0.4, 0.4);
var shapeStrokeColor = new paper.Color(0.0,0.0,0.0, 0.15);
var boundsStrokeColor = new paper.Color(0.0, 1.0, 1.0, 0.75);
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
	strokeColor: new paper.Color(0.0,0.0,0.0, 0.5),
	strokeWidth: 2
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

},{"underscore":34}],49:[function(require,module,exports){
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


},{"underscore":34}],50:[function(require,module,exports){
'use strict';

var Context = require('../Context.js');
var language = require('../language.js');
var settings = require('../settings.js');
var _ = require('underscore');

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
	var buildShapes = this.doc.build(context);
	this.buildLayer.style = settings.buildStyle;
	
	// console.log("childs", this.buildLayer.children);
	// console.log("buildShapes", buildShapes);
	_(buildShapes).each(function(shape) {
		if (shape instanceof paper.Path) return;
		if (shape instanceof paper.CompoundPath) return;
		// style type
		// shape.style = settings.buildStyle;
		console.log("shape,", shape);
		shape.style = 
		{
			fillColor: undefined,
			strokeWidth: 1,
			strokeColor: "red"
		};
	});

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

},{"../Context.js":35,"../language.js":39,"../settings.js":48,"underscore":34}],51:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvZW1wdHkuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9pbmRleF9icm93c2VyLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9jb21tb24uanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9kdW1wZXIuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9leGNlcHRpb24uanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9sb2FkZXIuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9tYXJrLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hL2NvcmUuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC9zY2hlbWEvZGVmYXVsdF9mdWxsLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfc2FmZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3NjaGVtYS9mYWlsc2FmZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3NjaGVtYS9qc29uLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvYmluYXJ5LmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9ib29sLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9mbG9hdC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvaW50LmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9qcy9mdW5jdGlvbi5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvanMvcmVnZXhwLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9qcy91bmRlZmluZWQuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL21hcC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvbWVyZ2UuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL251bGwuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL29tYXAuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL3BhaXJzLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS9zZXEuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9saWIvanMteWFtbC90eXBlL3NldC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L25vZGVfbW9kdWxlcy9qcy15YW1sL2xpYi9qcy15YW1sL3R5cGUvc3RyLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL2pzLXlhbWwvbGliL2pzLXlhbWwvdHlwZS90aW1lc3RhbXAuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9ub2RlX21vZHVsZXMvanMteWFtbC9ub2RlX21vZHVsZXMvZXNwcmltYS9lc3ByaW1hLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL211c3RhY2hlL211c3RhY2hlLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvbm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L0NvbnRleHQuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9QYXJzZXIuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9kb2NzLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvc3JjL2phdmFzY3JpcHQvanF1ZXJ5X3V0aWwuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9sYW5ndWFnZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3BhcGVyX3V0aWwuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9yZWdpb24vRG9jdW1lbnQuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9yZWdpb24vRWxsaXBzZS5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3JlZ2lvbi9SZWN0YW5nbGUuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9yZWdpb24vUmVnaW9uLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvc3JjL2phdmFzY3JpcHQvcmVnaW9uL1JlZ2lvbkdyaWQuanMiLCIvVXNlcnMvamJha3NlL0RvY3VtZW50cy9Qcm9qZWN0cy9jb21iX3NjcmlwdC9zcmMvamF2YXNjcmlwdC9yZWdpb24vVGV4dC5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3JlZ2lvbi9yZWdpb25UeXBlcy5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3NldHRpbmdzLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvc3JjL2phdmFzY3JpcHQvdWkvTG9nLmpzIiwiL1VzZXJzL2piYWtzZS9Eb2N1bWVudHMvUHJvamVjdHMvY29tYl9zY3JpcHQvc3JjL2phdmFzY3JpcHQvdWkvUHJldmlldy5qcyIsIi9Vc2Vycy9qYmFrc2UvRG9jdW1lbnRzL1Byb2plY3RzL2NvbWJfc2NyaXB0L3NyYy9qYXZhc2NyaXB0L3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6akRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDBIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Y0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgeWFtbCA9IHJlcXVpcmUoJy4vbGliL2pzLXlhbWwuanMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHlhbWw7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vanMteWFtbC9sb2FkZXInKTtcbnZhciBkdW1wZXIgPSByZXF1aXJlKCcuL2pzLXlhbWwvZHVtcGVyJyk7XG5cblxuZnVuY3Rpb24gZGVwcmVjYXRlZChuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGdW5jdGlvbiAnICsgbmFtZSArICcgaXMgZGVwcmVjYXRlZCBhbmQgY2Fubm90IGJlIHVzZWQuJyk7XG4gIH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMuVHlwZSAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vanMteWFtbC90eXBlJyk7XG5tb2R1bGUuZXhwb3J0cy5TY2hlbWEgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYScpO1xubW9kdWxlLmV4cG9ydHMuRkFJTFNBRkVfU0NIRU1BICAgICA9IHJlcXVpcmUoJy4vanMteWFtbC9zY2hlbWEvZmFpbHNhZmUnKTtcbm1vZHVsZS5leHBvcnRzLkpTT05fU0NIRU1BICAgICAgICAgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2pzb24nKTtcbm1vZHVsZS5leHBvcnRzLkNPUkVfU0NIRU1BICAgICAgICAgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2NvcmUnKTtcbm1vZHVsZS5leHBvcnRzLkRFRkFVTFRfU0FGRV9TQ0hFTUEgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfc2FmZScpO1xubW9kdWxlLmV4cG9ydHMuREVGQVVMVF9GVUxMX1NDSEVNQSA9IHJlcXVpcmUoJy4vanMteWFtbC9zY2hlbWEvZGVmYXVsdF9mdWxsJyk7XG5tb2R1bGUuZXhwb3J0cy5sb2FkICAgICAgICAgICAgICAgID0gbG9hZGVyLmxvYWQ7XG5tb2R1bGUuZXhwb3J0cy5sb2FkQWxsICAgICAgICAgICAgID0gbG9hZGVyLmxvYWRBbGw7XG5tb2R1bGUuZXhwb3J0cy5zYWZlTG9hZCAgICAgICAgICAgID0gbG9hZGVyLnNhZmVMb2FkO1xubW9kdWxlLmV4cG9ydHMuc2FmZUxvYWRBbGwgICAgICAgICA9IGxvYWRlci5zYWZlTG9hZEFsbDtcbm1vZHVsZS5leHBvcnRzLmR1bXAgICAgICAgICAgICAgICAgPSBkdW1wZXIuZHVtcDtcbm1vZHVsZS5leHBvcnRzLnNhZmVEdW1wICAgICAgICAgICAgPSBkdW1wZXIuc2FmZUR1bXA7XG5tb2R1bGUuZXhwb3J0cy5ZQU1MRXhjZXB0aW9uICAgICAgID0gcmVxdWlyZSgnLi9qcy15YW1sL2V4Y2VwdGlvbicpO1xuXG4vLyBEZXByZWNhcmVkIHNjaGVtYSBuYW1lcyBmcm9tIEpTLVlBTUwgMi4wLnhcbm1vZHVsZS5leHBvcnRzLk1JTklNQUxfU0NIRU1BID0gcmVxdWlyZSgnLi9qcy15YW1sL3NjaGVtYS9mYWlsc2FmZScpO1xubW9kdWxlLmV4cG9ydHMuU0FGRV9TQ0hFTUEgICAgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfc2FmZScpO1xubW9kdWxlLmV4cG9ydHMuREVGQVVMVF9TQ0hFTUEgPSByZXF1aXJlKCcuL2pzLXlhbWwvc2NoZW1hL2RlZmF1bHRfZnVsbCcpO1xuXG4vLyBEZXByZWNhdGVkIGZ1bmN0aW9ucyBmcm9tIEpTLVlBTUwgMS54Lnhcbm1vZHVsZS5leHBvcnRzLnNjYW4gICAgICAgICAgID0gZGVwcmVjYXRlZCgnc2NhbicpO1xubW9kdWxlLmV4cG9ydHMucGFyc2UgICAgICAgICAgPSBkZXByZWNhdGVkKCdwYXJzZScpO1xubW9kdWxlLmV4cG9ydHMuY29tcG9zZSAgICAgICAgPSBkZXByZWNhdGVkKCdjb21wb3NlJyk7XG5tb2R1bGUuZXhwb3J0cy5hZGRDb25zdHJ1Y3RvciA9IGRlcHJlY2F0ZWQoJ2FkZENvbnN0cnVjdG9yJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxuZnVuY3Rpb24gaXNOb3RoaW5nKHN1YmplY3QpIHtcbiAgcmV0dXJuICh1bmRlZmluZWQgPT09IHN1YmplY3QpIHx8IChudWxsID09PSBzdWJqZWN0KTtcbn1cblxuXG5mdW5jdGlvbiBpc09iamVjdChzdWJqZWN0KSB7XG4gIHJldHVybiAoJ29iamVjdCcgPT09IHR5cGVvZiBzdWJqZWN0KSAmJiAobnVsbCAhPT0gc3ViamVjdCk7XG59XG5cblxuZnVuY3Rpb24gdG9BcnJheShzZXF1ZW5jZSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShzZXF1ZW5jZSkpIHtcbiAgICByZXR1cm4gc2VxdWVuY2U7XG4gIH0gZWxzZSBpZiAoaXNOb3RoaW5nKHNlcXVlbmNlKSkge1xuICAgIHJldHVybiBbXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gWyBzZXF1ZW5jZSBdO1xuICB9XG59XG5cblxuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCwgc291cmNlKSB7XG4gIHZhciBpbmRleCwgbGVuZ3RoLCBrZXksIHNvdXJjZUtleXM7XG5cbiAgaWYgKHNvdXJjZSkge1xuICAgIHNvdXJjZUtleXMgPSBPYmplY3Qua2V5cyhzb3VyY2UpO1xuXG4gICAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHNvdXJjZUtleXMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgICAga2V5ID0gc291cmNlS2V5c1tpbmRleF07XG4gICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cblxuZnVuY3Rpb24gcmVwZWF0KHN0cmluZywgY291bnQpIHtcbiAgdmFyIHJlc3VsdCA9ICcnLCBjeWNsZTtcblxuICBmb3IgKGN5Y2xlID0gMDsgY3ljbGUgPCBjb3VudDsgY3ljbGUgKz0gMSkge1xuICAgIHJlc3VsdCArPSBzdHJpbmc7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzLmlzTm90aGluZyAgPSBpc05vdGhpbmc7XG5tb2R1bGUuZXhwb3J0cy5pc09iamVjdCAgID0gaXNPYmplY3Q7XG5tb2R1bGUuZXhwb3J0cy50b0FycmF5ICAgID0gdG9BcnJheTtcbm1vZHVsZS5leHBvcnRzLnJlcGVhdCAgICAgPSByZXBlYXQ7XG5tb2R1bGUuZXhwb3J0cy5leHRlbmQgICAgID0gZXh0ZW5kO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBjb21tb24gICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9jb21tb24nKTtcbnZhciBZQU1MRXhjZXB0aW9uICAgICAgID0gcmVxdWlyZSgnLi9leGNlcHRpb24nKTtcbnZhciBERUZBVUxUX0ZVTExfU0NIRU1BID0gcmVxdWlyZSgnLi9zY2hlbWEvZGVmYXVsdF9mdWxsJyk7XG52YXIgREVGQVVMVF9TQUZFX1NDSEVNQSA9IHJlcXVpcmUoJy4vc2NoZW1hL2RlZmF1bHRfc2FmZScpO1xuXG5cbnZhciBfdG9TdHJpbmcgICAgICAgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIF9oYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cblxudmFyIENIQVJfVEFCICAgICAgICAgICAgICAgICAgPSAweDA5OyAvKiBUYWIgKi9cbnZhciBDSEFSX0xJTkVfRkVFRCAgICAgICAgICAgID0gMHgwQTsgLyogTEYgKi9cbnZhciBDSEFSX0NBUlJJQUdFX1JFVFVSTiAgICAgID0gMHgwRDsgLyogQ1IgKi9cbnZhciBDSEFSX1NQQUNFICAgICAgICAgICAgICAgID0gMHgyMDsgLyogU3BhY2UgKi9cbnZhciBDSEFSX0VYQ0xBTUFUSU9OICAgICAgICAgID0gMHgyMTsgLyogISAqL1xudmFyIENIQVJfRE9VQkxFX1FVT1RFICAgICAgICAgPSAweDIyOyAvKiBcIiAqL1xudmFyIENIQVJfU0hBUlAgICAgICAgICAgICAgICAgPSAweDIzOyAvKiAjICovXG52YXIgQ0hBUl9QRVJDRU5UICAgICAgICAgICAgICA9IDB4MjU7IC8qICUgKi9cbnZhciBDSEFSX0FNUEVSU0FORCAgICAgICAgICAgID0gMHgyNjsgLyogJiAqL1xudmFyIENIQVJfU0lOR0xFX1FVT1RFICAgICAgICAgPSAweDI3OyAvKiAnICovXG52YXIgQ0hBUl9BU1RFUklTSyAgICAgICAgICAgICA9IDB4MkE7IC8qICogKi9cbnZhciBDSEFSX0NPTU1BICAgICAgICAgICAgICAgID0gMHgyQzsgLyogLCAqL1xudmFyIENIQVJfTUlOVVMgICAgICAgICAgICAgICAgPSAweDJEOyAvKiAtICovXG52YXIgQ0hBUl9DT0xPTiAgICAgICAgICAgICAgICA9IDB4M0E7IC8qIDogKi9cbnZhciBDSEFSX0dSRUFURVJfVEhBTiAgICAgICAgID0gMHgzRTsgLyogPiAqL1xudmFyIENIQVJfUVVFU1RJT04gICAgICAgICAgICAgPSAweDNGOyAvKiA/ICovXG52YXIgQ0hBUl9DT01NRVJDSUFMX0FUICAgICAgICA9IDB4NDA7IC8qIEAgKi9cbnZhciBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgID0gMHg1QjsgLyogWyAqL1xudmFyIENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVQgPSAweDVEOyAvKiBdICovXG52YXIgQ0hBUl9HUkFWRV9BQ0NFTlQgICAgICAgICA9IDB4NjA7IC8qIGAgKi9cbnZhciBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCAgID0gMHg3QjsgLyogeyAqL1xudmFyIENIQVJfVkVSVElDQUxfTElORSAgICAgICAgPSAweDdDOyAvKiB8ICovXG52YXIgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICA9IDB4N0Q7IC8qIH0gKi9cblxuXG52YXIgRVNDQVBFX1NFUVVFTkNFUyA9IHt9O1xuXG5FU0NBUEVfU0VRVUVOQ0VTWzB4MDBdICAgPSAnXFxcXDAnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDA3XSAgID0gJ1xcXFxhJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwOF0gICA9ICdcXFxcYic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MDldICAgPSAnXFxcXHQnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDBBXSAgID0gJ1xcXFxuJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwQl0gICA9ICdcXFxcdic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MENdICAgPSAnXFxcXGYnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDBEXSAgID0gJ1xcXFxyJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgxQl0gICA9ICdcXFxcZSc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MjJdICAgPSAnXFxcXFwiJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHg1Q10gICA9ICdcXFxcXFxcXCc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4ODVdICAgPSAnXFxcXE4nO1xuRVNDQVBFX1NFUVVFTkNFU1sweEEwXSAgID0gJ1xcXFxfJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgyMDI4XSA9ICdcXFxcTCc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MjAyOV0gPSAnXFxcXFAnO1xuXG5cbnZhciBERVBSRUNBVEVEX0JPT0xFQU5TX1NZTlRBWCA9IFtcbiAgJ3knLCAnWScsICd5ZXMnLCAnWWVzJywgJ1lFUycsICdvbicsICdPbicsICdPTicsXG4gICduJywgJ04nLCAnbm8nLCAnTm8nLCAnTk8nLCAnb2ZmJywgJ09mZicsICdPRkYnXG5dO1xuXG5cbmZ1bmN0aW9uIGNvbXBpbGVTdHlsZU1hcChzY2hlbWEsIG1hcCkge1xuICB2YXIgcmVzdWx0LCBrZXlzLCBpbmRleCwgbGVuZ3RoLCB0YWcsIHN0eWxlLCB0eXBlO1xuXG4gIGlmIChudWxsID09PSBtYXApIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICByZXN1bHQgPSB7fTtcbiAga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHRhZyA9IGtleXNbaW5kZXhdO1xuICAgIHN0eWxlID0gU3RyaW5nKG1hcFt0YWddKTtcblxuICAgIGlmICgnISEnID09PSB0YWcuc2xpY2UoMCwgMikpIHtcbiAgICAgIHRhZyA9ICd0YWc6eWFtbC5vcmcsMjAwMjonICsgdGFnLnNsaWNlKDIpO1xuICAgIH1cblxuICAgIHR5cGUgPSBzY2hlbWEuY29tcGlsZWRUeXBlTWFwW3RhZ107XG5cbiAgICBpZiAodHlwZSAmJiBfaGFzT3duUHJvcGVydHkuY2FsbCh0eXBlLmR1bXBTdHlsZUFsaWFzZXMsIHN0eWxlKSkge1xuICAgICAgc3R5bGUgPSB0eXBlLmR1bXBTdHlsZUFsaWFzZXNbc3R5bGVdO1xuICAgIH1cblxuICAgIHJlc3VsdFt0YWddID0gc3R5bGU7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIGVuY29kZUhleChjaGFyYWN0ZXIpIHtcbiAgdmFyIHN0cmluZywgaGFuZGxlLCBsZW5ndGg7XG5cbiAgc3RyaW5nID0gY2hhcmFjdGVyLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuXG4gIGlmIChjaGFyYWN0ZXIgPD0gMHhGRikge1xuICAgIGhhbmRsZSA9ICd4JztcbiAgICBsZW5ndGggPSAyO1xuICB9IGVsc2UgaWYgKGNoYXJhY3RlciA8PSAweEZGRkYpIHtcbiAgICBoYW5kbGUgPSAndSc7XG4gICAgbGVuZ3RoID0gNDtcbiAgfSBlbHNlIGlmIChjaGFyYWN0ZXIgPD0gMHhGRkZGRkZGRikge1xuICAgIGhhbmRsZSA9ICdVJztcbiAgICBsZW5ndGggPSA4O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdjb2RlIHBvaW50IHdpdGhpbiBhIHN0cmluZyBtYXkgbm90IGJlIGdyZWF0ZXIgdGhhbiAweEZGRkZGRkZGJyk7XG4gIH1cblxuICByZXR1cm4gJ1xcXFwnICsgaGFuZGxlICsgY29tbW9uLnJlcGVhdCgnMCcsIGxlbmd0aCAtIHN0cmluZy5sZW5ndGgpICsgc3RyaW5nO1xufVxuXG5cbmZ1bmN0aW9uIFN0YXRlKG9wdGlvbnMpIHtcbiAgdGhpcy5zY2hlbWEgICAgICA9IG9wdGlvbnNbJ3NjaGVtYSddIHx8IERFRkFVTFRfRlVMTF9TQ0hFTUE7XG4gIHRoaXMuaW5kZW50ICAgICAgPSBNYXRoLm1heCgxLCAob3B0aW9uc1snaW5kZW50J10gfHwgMikpO1xuICB0aGlzLnNraXBJbnZhbGlkID0gb3B0aW9uc1snc2tpcEludmFsaWQnXSB8fCBmYWxzZTtcbiAgdGhpcy5mbG93TGV2ZWwgICA9IChjb21tb24uaXNOb3RoaW5nKG9wdGlvbnNbJ2Zsb3dMZXZlbCddKSA/IC0xIDogb3B0aW9uc1snZmxvd0xldmVsJ10pO1xuICB0aGlzLnN0eWxlTWFwICAgID0gY29tcGlsZVN0eWxlTWFwKHRoaXMuc2NoZW1hLCBvcHRpb25zWydzdHlsZXMnXSB8fCBudWxsKTtcblxuICB0aGlzLmltcGxpY2l0VHlwZXMgPSB0aGlzLnNjaGVtYS5jb21waWxlZEltcGxpY2l0O1xuICB0aGlzLmV4cGxpY2l0VHlwZXMgPSB0aGlzLnNjaGVtYS5jb21waWxlZEV4cGxpY2l0O1xuXG4gIHRoaXMudGFnID0gbnVsbDtcbiAgdGhpcy5yZXN1bHQgPSAnJztcbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCkge1xuICByZXR1cm4gJ1xcbicgKyBjb21tb24ucmVwZWF0KCcgJywgc3RhdGUuaW5kZW50ICogbGV2ZWwpO1xufVxuXG5mdW5jdGlvbiB0ZXN0SW1wbGljaXRSZXNvbHZpbmcoc3RhdGUsIHN0cikge1xuICB2YXIgaW5kZXgsIGxlbmd0aCwgdHlwZTtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gc3RhdGUuaW1wbGljaXRUeXBlcy5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgdHlwZSA9IHN0YXRlLmltcGxpY2l0VHlwZXNbaW5kZXhdO1xuXG4gICAgaWYgKHR5cGUubG9hZFJlc29sdmVyICYmIHR5cGUubG9hZFJlc29sdmVyKHsgcmVzdWx0OiBzdHIgfSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gd3JpdGVTY2FsYXIoc3RhdGUsIG9iamVjdCkge1xuICB2YXIgaXNRdW90ZWQsIGNoZWNrcG9pbnQsIHBvc2l0aW9uLCBsZW5ndGgsIGNoYXJhY3RlciwgZmlyc3Q7XG5cbiAgc3RhdGUuZHVtcCA9ICcnO1xuICBpc1F1b3RlZCA9IGZhbHNlO1xuICBjaGVja3BvaW50ID0gMDtcbiAgZmlyc3QgPSBvYmplY3QuY2hhckNvZGVBdCgwKSB8fCAwO1xuXG4gIGlmICgtMSAhPT0gREVQUkVDQVRFRF9CT09MRUFOU19TWU5UQVguaW5kZXhPZihvYmplY3QpKSB7XG4gICAgLy8gRW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCBZQU1MIDEuMC8xLjEgbG9hZGVycy5cbiAgICBpc1F1b3RlZCA9IHRydWU7XG4gIH0gZWxzZSBpZiAoMCA9PT0gb2JqZWN0Lmxlbmd0aCkge1xuICAgIC8vIFF1b3RlIGVtcHR5IHN0cmluZ1xuICAgIGlzUXVvdGVkID0gdHJ1ZTtcbiAgfSBlbHNlIGlmIChDSEFSX1NQQUNFICAgID09PSBmaXJzdCB8fFxuICAgICAgICAgICAgIENIQVJfU1BBQ0UgICAgPT09IG9iamVjdC5jaGFyQ29kZUF0KG9iamVjdC5sZW5ndGggLSAxKSkge1xuICAgIGlzUXVvdGVkID0gdHJ1ZTtcbiAgfSBlbHNlIGlmIChDSEFSX01JTlVTICAgID09PSBmaXJzdCB8fFxuICAgICAgICAgICAgIENIQVJfUVVFU1RJT04gPT09IGZpcnN0KSB7XG4gICAgLy8gRG9uJ3QgY2hlY2sgc2Vjb25kIHN5bWJvbCBmb3Igc2ltcGxpY2l0eVxuICAgIGlzUXVvdGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGZvciAocG9zaXRpb24gPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBwb3NpdGlvbiA8IGxlbmd0aDsgcG9zaXRpb24gKz0gMSkge1xuICAgIGNoYXJhY3RlciA9IG9iamVjdC5jaGFyQ29kZUF0KHBvc2l0aW9uKTtcblxuICAgIGlmICghaXNRdW90ZWQpIHtcbiAgICAgIGlmIChDSEFSX1RBQiAgICAgICAgICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0NPTU1BICAgICAgICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX1NIQVJQICAgICAgICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0FNUEVSU0FORCAgICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0FTVEVSSVNLICAgICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0VYQ0xBTUFUSU9OICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX1ZFUlRJQ0FMX0xJTkUgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0dSRUFURVJfVEhBTiAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX1NJTkdMRV9RVU9URSAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0RPVUJMRV9RVU9URSAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX1BFUkNFTlQgICAgICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0NPTU1FUkNJQUxfQVQgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0NPTE9OICAgICAgICAgICAgICAgID09PSBjaGFyYWN0ZXIgfHxcbiAgICAgICAgICBDSEFSX0dSQVZFX0FDQ0VOVCAgICAgICAgID09PSBjaGFyYWN0ZXIpIHtcbiAgICAgICAgaXNRdW90ZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChFU0NBUEVfU0VRVUVOQ0VTW2NoYXJhY3Rlcl0gfHxcbiAgICAgICAgISgoMHgwMDAyMCA8PSBjaGFyYWN0ZXIgJiYgY2hhcmFjdGVyIDw9IDB4MDAwMDdFKSB8fFxuICAgICAgICAgICgweDAwMDg1ID09PSBjaGFyYWN0ZXIpICAgICAgICAgICAgICAgICAgICAgICAgIHx8XG4gICAgICAgICAgKDB4MDAwQTAgPD0gY2hhcmFjdGVyICYmIGNoYXJhY3RlciA8PSAweDAwRDdGRikgfHxcbiAgICAgICAgICAoMHgwRTAwMCA8PSBjaGFyYWN0ZXIgJiYgY2hhcmFjdGVyIDw9IDB4MDBGRkZEKSB8fFxuICAgICAgICAgICgweDEwMDAwIDw9IGNoYXJhY3RlciAmJiBjaGFyYWN0ZXIgPD0gMHgxMEZGRkYpKSkge1xuICAgICAgc3RhdGUuZHVtcCArPSBvYmplY3Quc2xpY2UoY2hlY2twb2ludCwgcG9zaXRpb24pO1xuICAgICAgc3RhdGUuZHVtcCArPSBFU0NBUEVfU0VRVUVOQ0VTW2NoYXJhY3Rlcl0gfHwgZW5jb2RlSGV4KGNoYXJhY3Rlcik7XG4gICAgICBjaGVja3BvaW50ID0gcG9zaXRpb24gKyAxO1xuICAgICAgaXNRdW90ZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjaGVja3BvaW50IDwgcG9zaXRpb24pIHtcbiAgICBzdGF0ZS5kdW1wICs9IG9iamVjdC5zbGljZShjaGVja3BvaW50LCBwb3NpdGlvbik7XG4gIH1cblxuICBpZiAoIWlzUXVvdGVkICYmIHRlc3RJbXBsaWNpdFJlc29sdmluZyhzdGF0ZSwgc3RhdGUuZHVtcCkpIHtcbiAgICBpc1F1b3RlZCA9IHRydWU7XG4gIH1cblxuICBpZiAoaXNRdW90ZWQpIHtcbiAgICBzdGF0ZS5kdW1wID0gJ1wiJyArIHN0YXRlLmR1bXAgKyAnXCInO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvd1NlcXVlbmNlKHN0YXRlLCBsZXZlbCwgb2JqZWN0KSB7XG4gIHZhciBfcmVzdWx0ID0gJycsXG4gICAgICBfdGFnICAgID0gc3RhdGUudGFnLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGg7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgLy8gV3JpdGUgb25seSB2YWxpZCBlbGVtZW50cy5cbiAgICBpZiAod3JpdGVOb2RlKHN0YXRlLCBsZXZlbCwgb2JqZWN0W2luZGV4XSwgZmFsc2UsIGZhbHNlKSkge1xuICAgICAgaWYgKDAgIT09IGluZGV4KSB7XG4gICAgICAgIF9yZXN1bHQgKz0gJywgJztcbiAgICAgIH1cbiAgICAgIF9yZXN1bHQgKz0gc3RhdGUuZHVtcDtcbiAgICB9XG4gIH1cblxuICBzdGF0ZS50YWcgPSBfdGFnO1xuICBzdGF0ZS5kdW1wID0gJ1snICsgX3Jlc3VsdCArICddJztcbn1cblxuZnVuY3Rpb24gd3JpdGVCbG9ja1NlcXVlbmNlKHN0YXRlLCBsZXZlbCwgb2JqZWN0LCBjb21wYWN0KSB7XG4gIHZhciBfcmVzdWx0ID0gJycsXG4gICAgICBfdGFnICAgID0gc3RhdGUudGFnLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGg7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgLy8gV3JpdGUgb25seSB2YWxpZCBlbGVtZW50cy5cbiAgICBpZiAod3JpdGVOb2RlKHN0YXRlLCBsZXZlbCArIDEsIG9iamVjdFtpbmRleF0sIHRydWUsIHRydWUpKSB7XG4gICAgICBpZiAoIWNvbXBhY3QgfHwgMCAhPT0gaW5kZXgpIHtcbiAgICAgICAgX3Jlc3VsdCArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgICB9XG4gICAgICBfcmVzdWx0ICs9ICctICcgKyBzdGF0ZS5kdW1wO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSBfcmVzdWx0IHx8ICdbXSc7IC8vIEVtcHR5IHNlcXVlbmNlIGlmIG5vIHZhbGlkIHZhbHVlcy5cbn1cblxuZnVuY3Rpb24gd3JpdGVGbG93TWFwcGluZyhzdGF0ZSwgbGV2ZWwsIG9iamVjdCkge1xuICB2YXIgX3Jlc3VsdCAgICAgICA9ICcnLFxuICAgICAgX3RhZyAgICAgICAgICA9IHN0YXRlLnRhZyxcbiAgICAgIG9iamVjdEtleUxpc3QgPSBPYmplY3Qua2V5cyhvYmplY3QpLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGgsXG4gICAgICBvYmplY3RLZXksXG4gICAgICBvYmplY3RWYWx1ZSxcbiAgICAgIHBhaXJCdWZmZXI7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdEtleUxpc3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHBhaXJCdWZmZXIgPSAnJztcblxuICAgIGlmICgwICE9PSBpbmRleCkge1xuICAgICAgcGFpckJ1ZmZlciArPSAnLCAnO1xuICAgIH1cblxuICAgIG9iamVjdEtleSA9IG9iamVjdEtleUxpc3RbaW5kZXhdO1xuICAgIG9iamVjdFZhbHVlID0gb2JqZWN0W29iamVjdEtleV07XG5cbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdEtleSwgZmFsc2UsIGZhbHNlKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCBrZXk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmR1bXAubGVuZ3RoID4gMTAyNCkge1xuICAgICAgcGFpckJ1ZmZlciArPSAnPyAnO1xuICAgIH1cblxuICAgIHBhaXJCdWZmZXIgKz0gc3RhdGUuZHVtcCArICc6ICc7XG5cbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdFZhbHVlLCBmYWxzZSwgZmFsc2UpKSB7XG4gICAgICBjb250aW51ZTsgLy8gU2tpcCB0aGlzIHBhaXIgYmVjYXVzZSBvZiBpbnZhbGlkIHZhbHVlLlxuICAgIH1cblxuICAgIHBhaXJCdWZmZXIgKz0gc3RhdGUuZHVtcDtcblxuICAgIC8vIEJvdGgga2V5IGFuZCB2YWx1ZSBhcmUgdmFsaWQuXG4gICAgX3Jlc3VsdCArPSBwYWlyQnVmZmVyO1xuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9ICd7JyArIF9yZXN1bHQgKyAnfSc7XG59XG5cbmZ1bmN0aW9uIHdyaXRlQmxvY2tNYXBwaW5nKHN0YXRlLCBsZXZlbCwgb2JqZWN0LCBjb21wYWN0KSB7XG4gIHZhciBfcmVzdWx0ICAgICAgID0gJycsXG4gICAgICBfdGFnICAgICAgICAgID0gc3RhdGUudGFnLFxuICAgICAgb2JqZWN0S2V5TGlzdCA9IE9iamVjdC5rZXlzKG9iamVjdCksXG4gICAgICBpbmRleCxcbiAgICAgIGxlbmd0aCxcbiAgICAgIG9iamVjdEtleSxcbiAgICAgIG9iamVjdFZhbHVlLFxuICAgICAgZXhwbGljaXRQYWlyLFxuICAgICAgcGFpckJ1ZmZlcjtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0S2V5TGlzdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgcGFpckJ1ZmZlciA9ICcnO1xuXG4gICAgaWYgKCFjb21wYWN0IHx8IDAgIT09IGluZGV4KSB7XG4gICAgICBwYWlyQnVmZmVyICs9IGdlbmVyYXRlTmV4dExpbmUoc3RhdGUsIGxldmVsKTtcbiAgICB9XG5cbiAgICBvYmplY3RLZXkgPSBvYmplY3RLZXlMaXN0W2luZGV4XTtcbiAgICBvYmplY3RWYWx1ZSA9IG9iamVjdFtvYmplY3RLZXldO1xuXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsICsgMSwgb2JqZWN0S2V5LCB0cnVlLCB0cnVlKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCBrZXkuXG4gICAgfVxuXG4gICAgZXhwbGljaXRQYWlyID0gKG51bGwgIT09IHN0YXRlLnRhZyAmJiAnPycgIT09IHN0YXRlLnRhZykgfHxcbiAgICAgICAgICAgICAgICAgICAoc3RhdGUuZHVtcCAmJiBzdGF0ZS5kdW1wLmxlbmd0aCA+IDEwMjQpO1xuXG4gICAgaWYgKGV4cGxpY2l0UGFpcikge1xuICAgICAgaWYgKHN0YXRlLmR1bXAgJiYgQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmR1bXAuY2hhckNvZGVBdCgwKSkge1xuICAgICAgICBwYWlyQnVmZmVyICs9ICc/JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhaXJCdWZmZXIgKz0gJz8gJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXA7XG5cbiAgICBpZiAoZXhwbGljaXRQYWlyKSB7XG4gICAgICBwYWlyQnVmZmVyICs9IGdlbmVyYXRlTmV4dExpbmUoc3RhdGUsIGxldmVsKTtcbiAgICB9XG5cbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwgKyAxLCBvYmplY3RWYWx1ZSwgdHJ1ZSwgZXhwbGljaXRQYWlyKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCB2YWx1ZS5cbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuZHVtcCAmJiBDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuZHVtcC5jaGFyQ29kZUF0KDApKSB7XG4gICAgICBwYWlyQnVmZmVyICs9ICc6JztcbiAgICB9IGVsc2Uge1xuICAgICAgcGFpckJ1ZmZlciArPSAnOiAnO1xuICAgIH1cblxuICAgIHBhaXJCdWZmZXIgKz0gc3RhdGUuZHVtcDtcblxuICAgIC8vIEJvdGgga2V5IGFuZCB2YWx1ZSBhcmUgdmFsaWQuXG4gICAgX3Jlc3VsdCArPSBwYWlyQnVmZmVyO1xuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9IF9yZXN1bHQgfHwgJ3t9JzsgLy8gRW1wdHkgbWFwcGluZyBpZiBubyB2YWxpZCBwYWlycy5cbn1cblxuZnVuY3Rpb24gZGV0ZWN0VHlwZShzdGF0ZSwgb2JqZWN0LCBleHBsaWNpdCkge1xuICB2YXIgX3Jlc3VsdCwgdHlwZUxpc3QsIGluZGV4LCBsZW5ndGgsIHR5cGUsIHN0eWxlO1xuXG4gIHR5cGVMaXN0ID0gZXhwbGljaXQgPyBzdGF0ZS5leHBsaWNpdFR5cGVzIDogc3RhdGUuaW1wbGljaXRUeXBlcztcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gdHlwZUxpc3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHR5cGUgPSB0eXBlTGlzdFtpbmRleF07XG5cbiAgICBpZiAoKHR5cGUuZHVtcEluc3RhbmNlT2YgIHx8IHR5cGUuZHVtcFByZWRpY2F0ZSkgJiZcbiAgICAgICAgKCF0eXBlLmR1bXBJbnN0YW5jZU9mIHx8ICgoJ29iamVjdCcgPT09IHR5cGVvZiBvYmplY3QpICYmIChvYmplY3QgaW5zdGFuY2VvZiB0eXBlLmR1bXBJbnN0YW5jZU9mKSkpICYmXG4gICAgICAgICghdHlwZS5kdW1wUHJlZGljYXRlICB8fCB0eXBlLmR1bXBQcmVkaWNhdGUob2JqZWN0KSkpIHtcblxuICAgICAgc3RhdGUudGFnID0gZXhwbGljaXQgPyB0eXBlLnRhZyA6ICc/JztcblxuICAgICAgaWYgKHR5cGUuZHVtcFJlcHJlc2VudGVyKSB7XG4gICAgICAgIHN0eWxlID0gc3RhdGUuc3R5bGVNYXBbdHlwZS50YWddIHx8IHR5cGUuZHVtcERlZmF1bHRTdHlsZTtcblxuICAgICAgICBpZiAoJ1tvYmplY3QgRnVuY3Rpb25dJyA9PT0gX3RvU3RyaW5nLmNhbGwodHlwZS5kdW1wUmVwcmVzZW50ZXIpKSB7XG4gICAgICAgICAgX3Jlc3VsdCA9IHR5cGUuZHVtcFJlcHJlc2VudGVyKG9iamVjdCwgc3R5bGUpO1xuICAgICAgICB9IGVsc2UgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHR5cGUuZHVtcFJlcHJlc2VudGVyLCBzdHlsZSkpIHtcbiAgICAgICAgICBfcmVzdWx0ID0gdHlwZS5kdW1wUmVwcmVzZW50ZXJbc3R5bGVdKG9iamVjdCwgc3R5bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCchPCcgKyB0eXBlLnRhZyArICc+IHRhZyByZXNvbHZlciBhY2NlcHRzIG5vdCBcIicgKyBzdHlsZSArICdcIiBzdHlsZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGUuZHVtcCA9IF9yZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gU2VyaWFsaXplcyBgb2JqZWN0YCBhbmQgd3JpdGVzIGl0IHRvIGdsb2JhbCBgcmVzdWx0YC5cbi8vIFJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzLCBvciBmYWxzZSBvbiBpbnZhbGlkIG9iamVjdC5cbi8vXG5mdW5jdGlvbiB3cml0ZU5vZGUoc3RhdGUsIGxldmVsLCBvYmplY3QsIGJsb2NrLCBjb21wYWN0KSB7XG4gIHN0YXRlLnRhZyA9IG51bGw7XG4gIHN0YXRlLmR1bXAgPSBvYmplY3Q7XG5cbiAgaWYgKCFkZXRlY3RUeXBlKHN0YXRlLCBvYmplY3QsIGZhbHNlKSkge1xuICAgIGRldGVjdFR5cGUoc3RhdGUsIG9iamVjdCwgdHJ1ZSk7XG4gIH1cblxuICB2YXIgdHlwZSA9IF90b1N0cmluZy5jYWxsKHN0YXRlLmR1bXApO1xuXG4gIGlmIChibG9jaykge1xuICAgIGJsb2NrID0gKDAgPiBzdGF0ZS5mbG93TGV2ZWwgfHwgc3RhdGUuZmxvd0xldmVsID4gbGV2ZWwpO1xuICB9XG5cbiAgaWYgKChudWxsICE9PSBzdGF0ZS50YWcgJiYgJz8nICE9PSBzdGF0ZS50YWcpIHx8ICgyICE9PSBzdGF0ZS5pbmRlbnQgJiYgbGV2ZWwgPiAwKSkge1xuICAgIGNvbXBhY3QgPSBmYWxzZTtcbiAgfVxuXG4gIGlmICgnW29iamVjdCBPYmplY3RdJyA9PT0gdHlwZSkge1xuICAgIGlmIChibG9jayAmJiAoMCAhPT0gT2JqZWN0LmtleXMoc3RhdGUuZHVtcCkubGVuZ3RoKSkge1xuICAgICAgd3JpdGVCbG9ja01hcHBpbmcoc3RhdGUsIGxldmVsLCBzdGF0ZS5kdW1wLCBjb21wYWN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgd3JpdGVGbG93TWFwcGluZyhzdGF0ZSwgbGV2ZWwsIHN0YXRlLmR1bXApO1xuICAgIH1cbiAgfSBlbHNlIGlmICgnW29iamVjdCBBcnJheV0nID09PSB0eXBlKSB7XG4gICAgaWYgKGJsb2NrICYmICgwICE9PSBzdGF0ZS5kdW1wLmxlbmd0aCkpIHtcbiAgICAgIHdyaXRlQmxvY2tTZXF1ZW5jZShzdGF0ZSwgbGV2ZWwsIHN0YXRlLmR1bXAsIGNvbXBhY3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3cml0ZUZsb3dTZXF1ZW5jZShzdGF0ZSwgbGV2ZWwsIHN0YXRlLmR1bXApO1xuICAgIH1cbiAgfSBlbHNlIGlmICgnW29iamVjdCBTdHJpbmddJyA9PT0gdHlwZSkge1xuICAgIGlmICgnPycgIT09IHN0YXRlLnRhZykge1xuICAgICAgd3JpdGVTY2FsYXIoc3RhdGUsIHN0YXRlLmR1bXApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChzdGF0ZS5za2lwSW52YWxpZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbigndW5hY2NlcHRhYmUga2luZCBvZiBhbiBvYmplY3QgdG8gZHVtcCAnICsgdHlwZSk7XG4gIH1cblxuICBpZiAobnVsbCAhPT0gc3RhdGUudGFnICYmICc/JyAhPT0gc3RhdGUudGFnKSB7XG4gICAgc3RhdGUuZHVtcCA9ICchPCcgKyBzdGF0ZS50YWcgKyAnPiAnICsgc3RhdGUuZHVtcDtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuXG5mdW5jdGlvbiBkdW1wKGlucHV0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBzdGF0ZSA9IG5ldyBTdGF0ZShvcHRpb25zKTtcblxuICBpZiAod3JpdGVOb2RlKHN0YXRlLCAwLCBpbnB1dCwgdHJ1ZSwgdHJ1ZSkpIHtcbiAgICByZXR1cm4gc3RhdGUuZHVtcCArICdcXG4nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnJztcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHNhZmVEdW1wKGlucHV0LCBvcHRpb25zKSB7XG4gIHJldHVybiBkdW1wKGlucHV0LCBjb21tb24uZXh0ZW5kKHsgc2NoZW1hOiBERUZBVUxUX1NBRkVfU0NIRU1BIH0sIG9wdGlvbnMpKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5kdW1wICAgICA9IGR1bXA7XG5tb2R1bGUuZXhwb3J0cy5zYWZlRHVtcCA9IHNhZmVEdW1wO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbmZ1bmN0aW9uIFlBTUxFeGNlcHRpb24ocmVhc29uLCBtYXJrKSB7XG4gIHRoaXMubmFtZSAgICA9ICdZQU1MRXhjZXB0aW9uJztcbiAgdGhpcy5yZWFzb24gID0gcmVhc29uO1xuICB0aGlzLm1hcmsgICAgPSBtYXJrO1xuICB0aGlzLm1lc3NhZ2UgPSB0aGlzLnRvU3RyaW5nKGZhbHNlKTtcbn1cblxuXG5ZQU1MRXhjZXB0aW9uLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKGNvbXBhY3QpIHtcbiAgdmFyIHJlc3VsdDtcblxuICByZXN1bHQgPSAnSlMtWUFNTDogJyArICh0aGlzLnJlYXNvbiB8fCAnKHVua25vd24gcmVhc29uKScpO1xuXG4gIGlmICghY29tcGFjdCAmJiB0aGlzLm1hcmspIHtcbiAgICByZXN1bHQgKz0gJyAnICsgdGhpcy5tYXJrLnRvU3RyaW5nKCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFlBTUxFeGNlcHRpb247XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIGNvbW1vbiAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL2NvbW1vbicpO1xudmFyIFlBTUxFeGNlcHRpb24gICAgICAgPSByZXF1aXJlKCcuL2V4Y2VwdGlvbicpO1xudmFyIE1hcmsgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL21hcmsnKTtcbnZhciBERUZBVUxUX1NBRkVfU0NIRU1BID0gcmVxdWlyZSgnLi9zY2hlbWEvZGVmYXVsdF9zYWZlJyk7XG52YXIgREVGQVVMVF9GVUxMX1NDSEVNQSA9IHJlcXVpcmUoJy4vc2NoZW1hL2RlZmF1bHRfZnVsbCcpO1xuXG5cbnZhciBfaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5cbnZhciBDT05URVhUX0ZMT1dfSU4gICA9IDE7XG52YXIgQ09OVEVYVF9GTE9XX09VVCAgPSAyO1xudmFyIENPTlRFWFRfQkxPQ0tfSU4gID0gMztcbnZhciBDT05URVhUX0JMT0NLX09VVCA9IDQ7XG5cblxudmFyIENIT01QSU5HX0NMSVAgID0gMTtcbnZhciBDSE9NUElOR19TVFJJUCA9IDI7XG52YXIgQ0hPTVBJTkdfS0VFUCAgPSAzO1xuXG5cbnZhciBDSEFSX1RBQiAgICAgICAgICAgICAgICAgID0gMHgwOTsgICAvKiBUYWIgKi9cbnZhciBDSEFSX0xJTkVfRkVFRCAgICAgICAgICAgID0gMHgwQTsgICAvKiBMRiAqL1xudmFyIENIQVJfQ0FSUklBR0VfUkVUVVJOICAgICAgPSAweDBEOyAgIC8qIENSICovXG52YXIgQ0hBUl9TUEFDRSAgICAgICAgICAgICAgICA9IDB4MjA7ICAgLyogU3BhY2UgKi9cbnZhciBDSEFSX0VYQ0xBTUFUSU9OICAgICAgICAgID0gMHgyMTsgICAvKiAhICovXG52YXIgQ0hBUl9ET1VCTEVfUVVPVEUgICAgICAgICA9IDB4MjI7ICAgLyogXCIgKi9cbnZhciBDSEFSX1NIQVJQICAgICAgICAgICAgICAgID0gMHgyMzsgICAvKiAjICovXG52YXIgQ0hBUl9QRVJDRU5UICAgICAgICAgICAgICA9IDB4MjU7ICAgLyogJSAqL1xudmFyIENIQVJfQU1QRVJTQU5EICAgICAgICAgICAgPSAweDI2OyAgIC8qICYgKi9cbnZhciBDSEFSX1NJTkdMRV9RVU9URSAgICAgICAgID0gMHgyNzsgICAvKiAnICovXG52YXIgQ0hBUl9BU1RFUklTSyAgICAgICAgICAgICA9IDB4MkE7ICAgLyogKiAqL1xudmFyIENIQVJfUExVUyAgICAgICAgICAgICAgICAgPSAweDJCOyAgIC8qICsgKi9cbnZhciBDSEFSX0NPTU1BICAgICAgICAgICAgICAgID0gMHgyQzsgICAvKiAsICovXG52YXIgQ0hBUl9NSU5VUyAgICAgICAgICAgICAgICA9IDB4MkQ7ICAgLyogLSAqL1xudmFyIENIQVJfRE9UICAgICAgICAgICAgICAgICAgPSAweDJFOyAgIC8qIC4gKi9cbnZhciBDSEFSX1NMQVNIICAgICAgICAgICAgICAgID0gMHgyRjsgICAvKiAvICovXG52YXIgQ0hBUl9ESUdJVF9aRVJPICAgICAgICAgICA9IDB4MzA7ICAgLyogMCAqL1xudmFyIENIQVJfRElHSVRfT05FICAgICAgICAgICAgPSAweDMxOyAgIC8qIDEgKi9cbnZhciBDSEFSX0RJR0lUX05JTkUgICAgICAgICAgID0gMHgzOTsgICAvKiA5ICovXG52YXIgQ0hBUl9DT0xPTiAgICAgICAgICAgICAgICA9IDB4M0E7ICAgLyogOiAqL1xudmFyIENIQVJfTEVTU19USEFOICAgICAgICAgICAgPSAweDNDOyAgIC8qIDwgKi9cbnZhciBDSEFSX0dSRUFURVJfVEhBTiAgICAgICAgID0gMHgzRTsgICAvKiA+ICovXG52YXIgQ0hBUl9RVUVTVElPTiAgICAgICAgICAgICA9IDB4M0Y7ICAgLyogPyAqL1xudmFyIENIQVJfQ09NTUVSQ0lBTF9BVCAgICAgICAgPSAweDQwOyAgIC8qIEAgKi9cbnZhciBDSEFSX0NBUElUQUxfQSAgICAgICAgICAgID0gMHg0MTsgICAvKiBBICovXG52YXIgQ0hBUl9DQVBJVEFMX0YgICAgICAgICAgICA9IDB4NDY7ICAgLyogRiAqL1xudmFyIENIQVJfQ0FQSVRBTF9MICAgICAgICAgICAgPSAweDRDOyAgIC8qIEwgKi9cbnZhciBDSEFSX0NBUElUQUxfTiAgICAgICAgICAgID0gMHg0RTsgICAvKiBOICovXG52YXIgQ0hBUl9DQVBJVEFMX1AgICAgICAgICAgICA9IDB4NTA7ICAgLyogUCAqL1xudmFyIENIQVJfQ0FQSVRBTF9VICAgICAgICAgICAgPSAweDU1OyAgIC8qIFUgKi9cbnZhciBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgID0gMHg1QjsgICAvKiBbICovXG52YXIgQ0hBUl9CQUNLU0xBU0ggICAgICAgICAgICA9IDB4NUM7ICAgLyogXFwgKi9cbnZhciBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUID0gMHg1RDsgICAvKiBdICovXG52YXIgQ0hBUl9VTkRFUlNDT1JFICAgICAgICAgICA9IDB4NUY7ICAgLyogXyAqL1xudmFyIENIQVJfR1JBVkVfQUNDRU5UICAgICAgICAgPSAweDYwOyAgIC8qIGAgKi9cbnZhciBDSEFSX1NNQUxMX0EgICAgICAgICAgICAgID0gMHg2MTsgICAvKiBhICovXG52YXIgQ0hBUl9TTUFMTF9CICAgICAgICAgICAgICA9IDB4NjI7ICAgLyogYiAqL1xudmFyIENIQVJfU01BTExfRSAgICAgICAgICAgICAgPSAweDY1OyAgIC8qIGUgKi9cbnZhciBDSEFSX1NNQUxMX0YgICAgICAgICAgICAgID0gMHg2NjsgICAvKiBmICovXG52YXIgQ0hBUl9TTUFMTF9OICAgICAgICAgICAgICA9IDB4NkU7ICAgLyogbiAqL1xudmFyIENIQVJfU01BTExfUiAgICAgICAgICAgICAgPSAweDcyOyAgIC8qIHIgKi9cbnZhciBDSEFSX1NNQUxMX1QgICAgICAgICAgICAgID0gMHg3NDsgICAvKiB0ICovXG52YXIgQ0hBUl9TTUFMTF9VICAgICAgICAgICAgICA9IDB4NzU7ICAgLyogdSAqL1xudmFyIENIQVJfU01BTExfViAgICAgICAgICAgICAgPSAweDc2OyAgIC8qIHYgKi9cbnZhciBDSEFSX1NNQUxMX1ggICAgICAgICAgICAgID0gMHg3ODsgICAvKiB4ICovXG52YXIgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgICA9IDB4N0I7ICAgLyogeyAqL1xudmFyIENIQVJfVkVSVElDQUxfTElORSAgICAgICAgPSAweDdDOyAgIC8qIHwgKi9cbnZhciBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQgID0gMHg3RDsgICAvKiB9ICovXG5cblxudmFyIFNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTID0ge307XG5cblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfRElHSVRfWkVST10gICA9ICdcXHgwMCc7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX1NNQUxMX0FdICAgICAgPSAnXFx4MDcnO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TTUFMTF9CXSAgICAgID0gJ1xceDA4JztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU01BTExfVF0gICAgICA9ICdcXHgwOSc7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX1RBQl0gICAgICAgICAgPSAnXFx4MDknO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TTUFMTF9OXSAgICAgID0gJ1xceDBBJztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU01BTExfVl0gICAgICA9ICdcXHgwQic7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX1NNQUxMX0ZdICAgICAgPSAnXFx4MEMnO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TTUFMTF9SXSAgICAgID0gJ1xceDBEJztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfU01BTExfRV0gICAgICA9ICdcXHgxQic7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX1NQQUNFXSAgICAgICAgPSAnICc7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX0RPVUJMRV9RVU9URV0gPSAnXFx4MjInO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TTEFTSF0gICAgICAgID0gJy8nO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9CQUNLU0xBU0hdICAgID0gJ1xceDVDJztcblNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW0NIQVJfQ0FQSVRBTF9OXSAgICA9ICdcXHg4NSc7XG5TSU1QTEVfRVNDQVBFX1NFUVVFTkNFU1tDSEFSX1VOREVSU0NPUkVdICAgPSAnXFx4QTAnO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9DQVBJVEFMX0xdICAgID0gJ1xcdTIwMjgnO1xuU0lNUExFX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9DQVBJVEFMX1BdICAgID0gJ1xcdTIwMjknO1xuXG5cbnZhciBIRVhBREVDSU1BTF9FU0NBUEVfU0VRVUVOQ0VTID0ge307XG5cbkhFWEFERUNJTUFMX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TTUFMTF9YXSAgID0gMjtcbkhFWEFERUNJTUFMX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9TTUFMTF9VXSAgID0gNDtcbkhFWEFERUNJTUFMX0VTQ0FQRV9TRVFVRU5DRVNbQ0hBUl9DQVBJVEFMX1VdID0gODtcblxuXG52YXIgUEFUVEVSTl9OT05fUFJJTlRBQkxFICAgICAgICAgPSAvW1xceDAwLVxceDA4XFx4MEJcXHgwQ1xceDBFLVxceDFGXFx4N0YtXFx4ODRcXHg4Ni1cXHg5RlxcdUQ4MDAtXFx1REZGRlxcdUZGRkVcXHVGRkZGXS87XG52YXIgUEFUVEVSTl9OT05fQVNDSUlfTElORV9CUkVBS1MgPSAvW1xceDg1XFx1MjAyOFxcdTIwMjldLztcbnZhciBQQVRURVJOX0ZMT1dfSU5ESUNBVE9SUyAgICAgICA9IC9bLFxcW1xcXVxce1xcfV0vO1xudmFyIFBBVFRFUk5fVEFHX0hBTkRMRSAgICAgICAgICAgID0gL14oPzohfCEhfCFbYS16XFwtXSshKSQvaTtcbnZhciBQQVRURVJOX1RBR19VUkkgICAgICAgICAgICAgICA9IC9eKD86IXxbXixcXFtcXF1cXHtcXH1dKSg/OiVbMC05YS1mXXsyfXxbMC05YS16XFwtIztcXC9cXD86QCY9XFwrXFwkLF9cXC4hflxcKidcXChcXClcXFtcXF1dKSokL2k7XG5cblxuZnVuY3Rpb24gU3RhdGUoaW5wdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5pbnB1dCAgICA9IGlucHV0O1xuXG4gIHRoaXMuZmlsZW5hbWUgPSBvcHRpb25zWydmaWxlbmFtZSddIHx8IG51bGw7XG4gIHRoaXMuc2NoZW1hICAgPSBvcHRpb25zWydzY2hlbWEnXSAgIHx8IERFRkFVTFRfRlVMTF9TQ0hFTUE7XG4gIHRoaXMuc3RyaWN0ICAgPSBvcHRpb25zWydzdHJpY3QnXSAgIHx8IGZhbHNlO1xuICB0aGlzLmxlZ2FjeSAgID0gb3B0aW9uc1snbGVnYWN5J10gICB8fCBmYWxzZTtcblxuICB0aGlzLmltcGxpY2l0VHlwZXMgICAgID0gdGhpcy5zY2hlbWEuY29tcGlsZWRJbXBsaWNpdDtcbiAgdGhpcy50eXBlTWFwICAgICAgICAgICA9IHRoaXMuc2NoZW1hLmNvbXBpbGVkVHlwZU1hcDtcblxuICB0aGlzLmxlbmd0aCAgICAgPSBpbnB1dC5sZW5ndGg7XG4gIHRoaXMucG9zaXRpb24gICA9IDA7XG4gIHRoaXMubGluZSAgICAgICA9IDA7XG4gIHRoaXMubGluZVN0YXJ0ICA9IDA7XG4gIHRoaXMubGluZUluZGVudCA9IDA7XG4gIHRoaXMuY2hhcmFjdGVyICA9IGlucHV0LmNoYXJDb2RlQXQoMCAvKnBvc2l0aW9uKi8pO1xuXG4gIC8qXG4gIHRoaXMudmVyc2lvbjtcbiAgdGhpcy5jaGVja0xpbmVCcmVha3M7XG4gIHRoaXMudGFnTWFwO1xuICB0aGlzLmFuY2hvck1hcDtcbiAgdGhpcy50YWc7XG4gIHRoaXMuYW5jaG9yO1xuICB0aGlzLmtpbmQ7XG4gIHRoaXMucmVzdWx0OyovXG5cbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKSB7XG4gIHJldHVybiBuZXcgWUFNTEV4Y2VwdGlvbihcbiAgICBtZXNzYWdlLFxuICAgIG5ldyBNYXJrKHN0YXRlLmZpbGVuYW1lLCBzdGF0ZS5pbnB1dCwgc3RhdGUucG9zaXRpb24sIHN0YXRlLmxpbmUsIChzdGF0ZS5wb3NpdGlvbiAtIHN0YXRlLmxpbmVTdGFydCkpKTtcbn1cblxuZnVuY3Rpb24gdGhyb3dFcnJvcihzdGF0ZSwgbWVzc2FnZSkge1xuICB0aHJvdyBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKTtcbn1cblxuZnVuY3Rpb24gdGhyb3dXYXJuaW5nKHN0YXRlLCBtZXNzYWdlKSB7XG4gIHZhciBlcnJvciA9IGdlbmVyYXRlRXJyb3Ioc3RhdGUsIG1lc3NhZ2UpO1xuXG4gIGlmIChzdGF0ZS5zdHJpY3QpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLndhcm4oZXJyb3IudG9TdHJpbmcoKSk7XG4gIH1cbn1cblxuXG52YXIgZGlyZWN0aXZlSGFuZGxlcnMgPSB7XG5cbiAgJ1lBTUwnOiBmdW5jdGlvbiBoYW5kbGVZYW1sRGlyZWN0aXZlKHN0YXRlLCBuYW1lLCBhcmdzKSB7XG5cbiAgICAgIHZhciBtYXRjaCwgbWFqb3IsIG1pbm9yO1xuXG4gICAgICBpZiAobnVsbCAhPT0gc3RhdGUudmVyc2lvbikge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZHVwbGljYXRpb24gb2YgJVlBTUwgZGlyZWN0aXZlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgxICE9PSBhcmdzLmxlbmd0aCkge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnWUFNTCBkaXJlY3RpdmUgYWNjZXB0cyBleGFjdGx5IG9uZSBhcmd1bWVudCcpO1xuICAgICAgfVxuXG4gICAgICBtYXRjaCA9IC9eKFswLTldKylcXC4oWzAtOV0rKSQvLmV4ZWMoYXJnc1swXSk7XG5cbiAgICAgIGlmIChudWxsID09PSBtYXRjaCkge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnaWxsLWZvcm1lZCBhcmd1bWVudCBvZiB0aGUgWUFNTCBkaXJlY3RpdmUnKTtcbiAgICAgIH1cblxuICAgICAgbWFqb3IgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgbWlub3IgPSBwYXJzZUludChtYXRjaFsyXSwgMTApO1xuXG4gICAgICBpZiAoMSAhPT0gbWFqb3IpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuYWNjZXB0YWJsZSBZQU1MIHZlcnNpb24gb2YgdGhlIGRvY3VtZW50Jyk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRlLnZlcnNpb24gPSBhcmdzWzBdO1xuICAgICAgc3RhdGUuY2hlY2tMaW5lQnJlYWtzID0gKG1pbm9yIDwgMik7XG5cbiAgICAgIGlmICgxICE9PSBtaW5vciAmJiAyICE9PSBtaW5vcikge1xuICAgICAgICB0aHJvd1dhcm5pbmcoc3RhdGUsICd1bnN1cHBvcnRlZCBZQU1MIHZlcnNpb24gb2YgdGhlIGRvY3VtZW50Jyk7XG4gICAgICB9XG4gICAgfSxcblxuICAnVEFHJzogZnVuY3Rpb24gaGFuZGxlVGFnRGlyZWN0aXZlKHN0YXRlLCBuYW1lLCBhcmdzKSB7XG5cbiAgICAgIHZhciBoYW5kbGUsIHByZWZpeDtcblxuICAgICAgaWYgKDIgIT09IGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdUQUcgZGlyZWN0aXZlIGFjY2VwdHMgZXhhY3RseSB0d28gYXJndW1lbnRzJyk7XG4gICAgICB9XG5cbiAgICAgIGhhbmRsZSA9IGFyZ3NbMF07XG4gICAgICBwcmVmaXggPSBhcmdzWzFdO1xuXG4gICAgICBpZiAoIVBBVFRFUk5fVEFHX0hBTkRMRS50ZXN0KGhhbmRsZSkpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2lsbC1mb3JtZWQgdGFnIGhhbmRsZSAoZmlyc3QgYXJndW1lbnQpIG9mIHRoZSBUQUcgZGlyZWN0aXZlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbChzdGF0ZS50YWdNYXAsIGhhbmRsZSkpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RoZXJlIGlzIGEgcHJldmlvdXNseSBkZWNsYXJlZCBzdWZmaXggZm9yIFwiJyArIGhhbmRsZSArICdcIiB0YWcgaGFuZGxlJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghUEFUVEVSTl9UQUdfVVJJLnRlc3QocHJlZml4KSkge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnaWxsLWZvcm1lZCB0YWcgcHJlZml4IChzZWNvbmQgYXJndW1lbnQpIG9mIHRoZSBUQUcgZGlyZWN0aXZlJyk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRlLnRhZ01hcFtoYW5kbGVdID0gcHJlZml4O1xuICAgIH1cbn07XG5cblxuZnVuY3Rpb24gY2FwdHVyZVNlZ21lbnQoc3RhdGUsIHN0YXJ0LCBlbmQsIGNoZWNrSnNvbikge1xuICB2YXIgX3Bvc2l0aW9uLCBfbGVuZ3RoLCBfY2hhcmFjdGVyLCBfcmVzdWx0O1xuXG4gIGlmIChzdGFydCA8IGVuZCkge1xuICAgIF9yZXN1bHQgPSBzdGF0ZS5pbnB1dC5zbGljZShzdGFydCwgZW5kKTtcblxuICAgIGlmIChjaGVja0pzb24pIHtcbiAgICAgIGZvciAoX3Bvc2l0aW9uID0gMCwgX2xlbmd0aCA9IF9yZXN1bHQubGVuZ3RoO1xuICAgICAgICAgICBfcG9zaXRpb24gPCBfbGVuZ3RoO1xuICAgICAgICAgICBfcG9zaXRpb24gKz0gMSkge1xuICAgICAgICBfY2hhcmFjdGVyID0gX3Jlc3VsdC5jaGFyQ29kZUF0KF9wb3NpdGlvbik7XG4gICAgICAgIGlmICghKDB4MDkgPT09IF9jaGFyYWN0ZXIgfHxcbiAgICAgICAgICAgICAgMHgyMCA8PSBfY2hhcmFjdGVyICYmIF9jaGFyYWN0ZXIgPD0gMHgxMEZGRkYpKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2V4cGVjdGVkIHZhbGlkIEpTT04gY2hhcmFjdGVyJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0ZS5yZXN1bHQgKz0gX3Jlc3VsdDtcbiAgfVxufVxuXG5mdW5jdGlvbiBtZXJnZU1hcHBpbmdzKHN0YXRlLCBkZXN0aW5hdGlvbiwgc291cmNlKSB7XG4gIHZhciBzb3VyY2VLZXlzLCBrZXksIGluZGV4LCBxdWFudGl0eTtcblxuICBpZiAoIWNvbW1vbi5pc09iamVjdChzb3VyY2UpKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2Nhbm5vdCBtZXJnZSBtYXBwaW5nczsgdGhlIHByb3ZpZGVkIHNvdXJjZSBvYmplY3QgaXMgdW5hY2NlcHRhYmxlJyk7XG4gIH1cblxuICBzb3VyY2VLZXlzID0gT2JqZWN0LmtleXMoc291cmNlKTtcblxuICBmb3IgKGluZGV4ID0gMCwgcXVhbnRpdHkgPSBzb3VyY2VLZXlzLmxlbmd0aDsgaW5kZXggPCBxdWFudGl0eTsgaW5kZXggKz0gMSkge1xuICAgIGtleSA9IHNvdXJjZUtleXNbaW5kZXhdO1xuXG4gICAgaWYgKCFfaGFzT3duUHJvcGVydHkuY2FsbChkZXN0aW5hdGlvbiwga2V5KSkge1xuICAgICAgZGVzdGluYXRpb25ba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBfcmVzdWx0LCBrZXlUYWcsIGtleU5vZGUsIHZhbHVlTm9kZSkge1xuICB2YXIgaW5kZXgsIHF1YW50aXR5O1xuXG4gIGtleU5vZGUgPSBTdHJpbmcoa2V5Tm9kZSk7XG5cbiAgaWYgKG51bGwgPT09IF9yZXN1bHQpIHtcbiAgICBfcmVzdWx0ID0ge307XG4gIH1cblxuICBpZiAoJ3RhZzp5YW1sLm9yZywyMDAyOm1lcmdlJyA9PT0ga2V5VGFnKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWVOb2RlKSkge1xuICAgICAgZm9yIChpbmRleCA9IDAsIHF1YW50aXR5ID0gdmFsdWVOb2RlLmxlbmd0aDsgaW5kZXggPCBxdWFudGl0eTsgaW5kZXggKz0gMSkge1xuICAgICAgICBtZXJnZU1hcHBpbmdzKHN0YXRlLCBfcmVzdWx0LCB2YWx1ZU5vZGVbaW5kZXhdKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbWVyZ2VNYXBwaW5ncyhzdGF0ZSwgX3Jlc3VsdCwgdmFsdWVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgX3Jlc3VsdFtrZXlOb2RlXSA9IHZhbHVlTm9kZTtcbiAgfVxuXG4gIHJldHVybiBfcmVzdWx0O1xufVxuXG5mdW5jdGlvbiByZWFkTGluZUJyZWFrKHN0YXRlKSB7XG4gIGlmIChDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgc3RhdGUucG9zaXRpb24gKz0gMTtcbiAgfSBlbHNlIGlmIChDSEFSX0NBUlJJQUdFX1JFVFVSTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgaWYgKENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSkpIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uICs9IDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uICs9IDE7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdhIGxpbmUgYnJlYWsgaXMgZXhwZWN0ZWQnKTtcbiAgfVxuXG4gIHN0YXRlLmxpbmUgKz0gMTtcbiAgc3RhdGUubGluZVN0YXJ0ID0gc3RhdGUucG9zaXRpb247XG4gIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xufVxuXG5mdW5jdGlvbiBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBhbGxvd0NvbW1lbnRzLCBjaGVja0luZGVudCkge1xuICB2YXIgbGluZUJyZWFrcyA9IDA7XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgd2hpbGUgKENIQVJfU1BBQ0UgPT09IHN0YXRlLmNoYXJhY3RlciB8fCBDSEFSX1RBQiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH1cblxuICAgIGlmIChhbGxvd0NvbW1lbnRzICYmIENIQVJfU0hBUlAgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgZG8geyBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pOyB9XG4gICAgICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGggJiZcbiAgICAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gIT09IHN0YXRlLmNoYXJhY3Rlcik7XG4gICAgfVxuXG4gICAgaWYgKENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgcmVhZExpbmVCcmVhayhzdGF0ZSk7XG4gICAgICBsaW5lQnJlYWtzICs9IDE7XG4gICAgICBzdGF0ZS5saW5lSW5kZW50ID0gMDtcblxuICAgICAgd2hpbGUgKENIQVJfU1BBQ0UgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICBzdGF0ZS5saW5lSW5kZW50ICs9IDE7XG4gICAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0ZS5saW5lSW5kZW50IDwgY2hlY2tJbmRlbnQpIHtcbiAgICAgICAgdGhyb3dXYXJuaW5nKHN0YXRlLCAnZGVmaWNpZW50IGluZGVudGF0aW9uJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsaW5lQnJlYWtzO1xufVxuXG5mdW5jdGlvbiB0ZXN0RG9jdW1lbnRTZXBhcmF0b3Ioc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbiwgX2NoYXJhY3RlcjtcblxuICBpZiAoc3RhdGUucG9zaXRpb24gPT09IHN0YXRlLmxpbmVTdGFydCAmJlxuICAgICAgKENIQVJfTUlOVVMgPT09IHN0YXRlLmNoYXJhY3RlciB8fCBDSEFSX0RPVCA9PT0gc3RhdGUuY2hhcmFjdGVyKSAmJlxuICAgICAgc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpID09PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgIHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAyKSA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG5cbiAgICBfcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbiArIDM7XG4gICAgX2NoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoX3Bvc2l0aW9uKTtcblxuICAgIGlmIChfcG9zaXRpb24gPj0gc3RhdGUubGVuZ3RoIHx8XG4gICAgICAgIENIQVJfU1BBQ0UgICAgICAgICAgID09PSBfY2hhcmFjdGVyIHx8XG4gICAgICAgIENIQVJfVEFCICAgICAgICAgICAgID09PSBfY2hhcmFjdGVyIHx8XG4gICAgICAgIENIQVJfTElORV9GRUVEICAgICAgID09PSBfY2hhcmFjdGVyIHx8XG4gICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBfY2hhcmFjdGVyKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHdyaXRlRm9sZGVkTGluZXMoc3RhdGUsIGNvdW50KSB7XG4gIGlmICgxID09PSBjb3VudCkge1xuICAgIHN0YXRlLnJlc3VsdCArPSAnICc7XG4gIH0gZWxzZSBpZiAoY291bnQgPiAxKSB7XG4gICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJ1xcbicsIGNvdW50IC0gMSk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiByZWFkUGxhaW5TY2FsYXIoc3RhdGUsIG5vZGVJbmRlbnQsIHdpdGhpbkZsb3dDb2xsZWN0aW9uKSB7XG4gIHZhciBwcmVjZWRpbmcsXG4gICAgICBmb2xsb3dpbmcsXG4gICAgICBjYXB0dXJlU3RhcnQsXG4gICAgICBjYXB0dXJlRW5kLFxuICAgICAgaGFzUGVuZGluZ0NvbnRlbnQsXG4gICAgICBfbGluZSxcbiAgICAgIF9saW5lU3RhcnQsXG4gICAgICBfbGluZUluZGVudCxcbiAgICAgIF9raW5kID0gc3RhdGUua2luZCxcbiAgICAgIF9yZXN1bHQgPSBzdGF0ZS5yZXN1bHQ7XG5cbiAgaWYgKENIQVJfU1BBQ0UgICAgICAgICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9UQUIgICAgICAgICAgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9DT01NQSAgICAgICAgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVQgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfU0hBUlAgICAgICAgICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9BTVBFUlNBTkQgICAgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX0FTVEVSSVNLICAgICAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfRVhDTEFNQVRJT04gICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9WRVJUSUNBTF9MSU5FICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX0dSRUFURVJfVEhBTiAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfU0lOR0xFX1FVT1RFICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9ET1VCTEVfUVVPVEUgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICBDSEFSX1BFUkNFTlQgICAgICAgICAgICAgID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgIENIQVJfQ09NTUVSQ0lBTF9BVCAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9HUkFWRV9BQ0NFTlQgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKENIQVJfUVVFU1RJT04gPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgQ0hBUl9NSU5VUyA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgZm9sbG93aW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgaWYgKENIQVJfU1BBQ0UgICAgICAgICAgICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgQ0hBUl9UQUIgICAgICAgICAgICAgICAgICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgd2l0aGluRmxvd0NvbGxlY3Rpb24gJiZcbiAgICAgICAgKENIQVJfQ09NTUEgICAgICAgICAgICAgICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgIENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICA9PT0gZm9sbG93aW5nKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLmtpbmQgPSAnc2NhbGFyJztcbiAgc3RhdGUucmVzdWx0ID0gJyc7XG4gIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgaGFzUGVuZGluZ0NvbnRlbnQgPSBmYWxzZTtcblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICBpZiAoQ0hBUl9DT0xPTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBmb2xsb3dpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSk7XG5cbiAgICAgIGlmIChDSEFSX1NQQUNFICAgICAgICAgICAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICAgQ0hBUl9UQUIgICAgICAgICAgICAgICAgICAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgIENIQVJfTElORV9GRUVEICAgICAgICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICAgd2l0aGluRmxvd0NvbGxlY3Rpb24gJiZcbiAgICAgICAgICAoQ0hBUl9DT01NQSAgICAgICAgICAgICAgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICAgIENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVCAgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgICBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgICAgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgICA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICAgIENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCAgPT09IGZvbGxvd2luZykpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKENIQVJfU0hBUlAgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgcHJlY2VkaW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiAtIDEpO1xuXG4gICAgICBpZiAoQ0hBUl9TUEFDRSAgICAgICAgICAgPT09IHByZWNlZGluZyB8fFxuICAgICAgICAgIENIQVJfVEFCICAgICAgICAgICAgID09PSBwcmVjZWRpbmcgfHxcbiAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICA9PT0gcHJlY2VkaW5nIHx8XG4gICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gPT09IHByZWNlZGluZykge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAoKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiYgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSkgfHxcbiAgICAgICAgICAgICAgIHdpdGhpbkZsb3dDb2xsZWN0aW9uICYmXG4gICAgICAgICAgICAgICAoQ0hBUl9DT01NQSAgICAgICAgICAgICAgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICAgICAgICAgICAgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICAgICAgICAgICAgQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICAgICAgICAgICAgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgICA9PT0gc3RhdGUuY2hhcmFjdGVyIHx8XG4gICAgICAgICAgICAgICAgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICA9PT0gc3RhdGUuY2hhcmFjdGVyKSkge1xuICAgICAgYnJlYWs7XG5cbiAgICB9IGVsc2UgaWYgKENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIF9saW5lID0gc3RhdGUubGluZTtcbiAgICAgIF9saW5lU3RhcnQgPSBzdGF0ZS5saW5lU3RhcnQ7XG4gICAgICBfbGluZUluZGVudCA9IHN0YXRlLmxpbmVJbmRlbnQ7XG4gICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBmYWxzZSwgLTEpO1xuXG4gICAgICBpZiAoc3RhdGUubGluZUluZGVudCA+PSBub2RlSW5kZW50KSB7XG4gICAgICAgIGhhc1BlbmRpbmdDb250ZW50ID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5wb3NpdGlvbiA9IGNhcHR1cmVFbmQ7XG4gICAgICAgIHN0YXRlLmxpbmUgPSBfbGluZTtcbiAgICAgICAgc3RhdGUubGluZVN0YXJ0ID0gX2xpbmVTdGFydDtcbiAgICAgICAgc3RhdGUubGluZUluZGVudCA9IF9saW5lSW5kZW50O1xuICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGhhc1BlbmRpbmdDb250ZW50KSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kLCBmYWxzZSk7XG4gICAgICB3cml0ZUZvbGRlZExpbmVzKHN0YXRlLCBzdGF0ZS5saW5lIC0gX2xpbmUpO1xuICAgICAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgaGFzUGVuZGluZ0NvbnRlbnQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoQ0hBUl9TUEFDRSAhPT0gc3RhdGUuY2hhcmFjdGVyICYmIENIQVJfVEFCICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbiArIDE7XG4gICAgfVxuXG4gICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgfVxuXG4gIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIGZhbHNlKTtcblxuICBpZiAoc3RhdGUucmVzdWx0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgc3RhdGUua2luZCA9IF9raW5kO1xuICAgIHN0YXRlLnJlc3VsdCA9IF9yZXN1bHQ7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWRTaW5nbGVRdW90ZWRTY2FsYXIoc3RhdGUsIG5vZGVJbmRlbnQpIHtcbiAgdmFyIGNhcHR1cmVTdGFydCwgY2FwdHVyZUVuZDtcblxuICBpZiAoQ0hBUl9TSU5HTEVfUVVPVEUgIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0YXRlLmtpbmQgPSAnc2NhbGFyJztcbiAgc3RhdGUucmVzdWx0ID0gJyc7XG4gIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICBpZiAoQ0hBUl9TSU5HTEVfUVVPVEUgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgc3RhdGUucG9zaXRpb24sIHRydWUpO1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgaWYgKENIQVJfU0lOR0xFX1FVT1RFID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIHRydWUpO1xuICAgICAgd3JpdGVGb2xkZWRMaW5lcyhzdGF0ZSwgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgZmFsc2UsIG5vZGVJbmRlbnQpKTtcbiAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgfSBlbHNlIGlmIChzdGF0ZS5wb3NpdGlvbiA9PT0gc3RhdGUubGluZVN0YXJ0ICYmIHRlc3REb2N1bWVudFNlcGFyYXRvcihzdGF0ZSkpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgZG9jdW1lbnQgd2l0aGluIGEgc2luZ2xlIHF1b3RlZCBzY2FsYXInKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgIH1cbiAgfVxuXG4gIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgc3RyZWFtIHdpdGhpbiBhIHNpbmdsZSBxdW90ZWQgc2NhbGFyJyk7XG59XG5cbmZ1bmN0aW9uIHJlYWREb3VibGVRdW90ZWRTY2FsYXIoc3RhdGUsIG5vZGVJbmRlbnQpIHtcbiAgdmFyIGNhcHR1cmVTdGFydCxcbiAgICAgIGNhcHR1cmVFbmQsXG4gICAgICBoZXhMZW5ndGgsXG4gICAgICBoZXhJbmRleCxcbiAgICAgIGhleE9mZnNldCxcbiAgICAgIGhleFJlc3VsdDtcblxuICBpZiAoQ0hBUl9ET1VCTEVfUVVPVEUgIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0YXRlLmtpbmQgPSAnc2NhbGFyJztcbiAgc3RhdGUucmVzdWx0ID0gJyc7XG4gIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICBpZiAoQ0hBUl9ET1VCTEVfUVVPVEUgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgc3RhdGUucG9zaXRpb24sIHRydWUpO1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgfSBlbHNlIGlmIChDSEFSX0JBQ0tTTEFTSCA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBzdGF0ZS5wb3NpdGlvbiwgdHJ1ZSk7XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICBpZiAoQ0hBUl9MSU5FX0ZFRUQgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgZmFsc2UsIG5vZGVJbmRlbnQpO1xuXG4gICAgICB9IGVsc2UgaWYgKFNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW3N0YXRlLmNoYXJhY3Rlcl0pIHtcbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IFNJTVBMRV9FU0NBUEVfU0VRVUVOQ0VTW3N0YXRlLmNoYXJhY3Rlcl07XG4gICAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICAgIH0gZWxzZSBpZiAoSEVYQURFQ0lNQUxfRVNDQVBFX1NFUVVFTkNFU1tzdGF0ZS5jaGFyYWN0ZXJdKSB7XG4gICAgICAgIGhleExlbmd0aCA9IEhFWEFERUNJTUFMX0VTQ0FQRV9TRVFVRU5DRVNbc3RhdGUuY2hhcmFjdGVyXTtcbiAgICAgICAgaGV4UmVzdWx0ID0gMDtcblxuICAgICAgICBmb3IgKGhleEluZGV4ID0gMTsgaGV4SW5kZXggPD0gaGV4TGVuZ3RoOyBoZXhJbmRleCArPSAxKSB7XG4gICAgICAgICAgaGV4T2Zmc2V0ID0gKGhleExlbmd0aCAtIGhleEluZGV4KSAqIDQ7XG4gICAgICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgICAgIGlmIChDSEFSX0RJR0lUX1pFUk8gPD0gc3RhdGUuY2hhcmFjdGVyICYmIHN0YXRlLmNoYXJhY3RlciA8PSBDSEFSX0RJR0lUX05JTkUpIHtcbiAgICAgICAgICAgIGhleFJlc3VsdCB8PSAoc3RhdGUuY2hhcmFjdGVyIC0gQ0hBUl9ESUdJVF9aRVJPKSA8PCBoZXhPZmZzZXQ7XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKENIQVJfQ0FQSVRBTF9BIDw9IHN0YXRlLmNoYXJhY3RlciAmJiBzdGF0ZS5jaGFyYWN0ZXIgPD0gQ0hBUl9DQVBJVEFMX0YpIHtcbiAgICAgICAgICAgIGhleFJlc3VsdCB8PSAoc3RhdGUuY2hhcmFjdGVyIC0gQ0hBUl9DQVBJVEFMX0EgKyAxMCkgPDwgaGV4T2Zmc2V0O1xuXG4gICAgICAgICAgfSBlbHNlIGlmIChDSEFSX1NNQUxMX0EgPD0gc3RhdGUuY2hhcmFjdGVyICYmIHN0YXRlLmNoYXJhY3RlciA8PSBDSEFSX1NNQUxMX0YpIHtcbiAgICAgICAgICAgIGhleFJlc3VsdCB8PSAoc3RhdGUuY2hhcmFjdGVyIC0gQ0hBUl9TTUFMTF9BICsgMTApIDw8IGhleE9mZnNldDtcblxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZXhwZWN0ZWQgaGV4YWRlY2ltYWwgY2hhcmFjdGVyJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoaGV4UmVzdWx0KTtcbiAgICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3Vua25vd24gZXNjYXBlIHNlcXVlbmNlJyk7XG4gICAgICB9XG5cbiAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcblxuICAgIH0gZWxzZSBpZiAoQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgY2FwdHVyZUVuZCwgdHJ1ZSk7XG4gICAgICB3cml0ZUZvbGRlZExpbmVzKHN0YXRlLCBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBmYWxzZSwgbm9kZUluZGVudCkpO1xuICAgICAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICB9IGVsc2UgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiYgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZXhwZWN0ZWQgZW5kIG9mIHRoZSBkb2N1bWVudCB3aXRoaW4gYSBkb3VibGUgcXVvdGVkIHNjYWxhcicpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG4gICAgfVxuICB9XG5cbiAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZXhwZWN0ZWQgZW5kIG9mIHRoZSBzdHJlYW0gd2l0aGluIGEgZG91YmxlIHF1b3RlZCBzY2FsYXInKTtcbn1cblxuZnVuY3Rpb24gcmVhZEZsb3dDb2xsZWN0aW9uKHN0YXRlLCBub2RlSW5kZW50KSB7XG4gIHZhciByZWFkTmV4dCA9IHRydWUsXG4gICAgICBfbGluZSxcbiAgICAgIF90YWcgICAgID0gc3RhdGUudGFnLFxuICAgICAgX3Jlc3VsdCxcbiAgICAgIGZvbGxvd2luZyxcbiAgICAgIHRlcm1pbmF0b3IsXG4gICAgICBpc1BhaXIsXG4gICAgICBpc0V4cGxpY2l0UGFpcixcbiAgICAgIGlzTWFwcGluZyxcbiAgICAgIGtleU5vZGUsXG4gICAgICBrZXlUYWcsXG4gICAgICB2YWx1ZU5vZGU7XG5cbiAgc3dpdGNoIChzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgY2FzZSBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQ6XG4gICAgdGVybWluYXRvciA9IENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVQ7XG4gICAgaXNNYXBwaW5nID0gZmFsc2U7XG4gICAgX3Jlc3VsdCA9IFtdO1xuICAgIGJyZWFrO1xuXG4gIGNhc2UgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQ6XG4gICAgdGVybWluYXRvciA9IENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVDtcbiAgICBpc01hcHBpbmcgPSB0cnVlO1xuICAgIF9yZXN1bHQgPSB7fTtcbiAgICBicmVhaztcblxuICBkZWZhdWx0OlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChudWxsICE9PSBzdGF0ZS5hbmNob3IpIHtcbiAgICBzdGF0ZS5hbmNob3JNYXBbc3RhdGUuYW5jaG9yXSA9IF9yZXN1bHQ7XG4gIH1cblxuICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIG5vZGVJbmRlbnQpO1xuXG4gICAgaWYgKHN0YXRlLmNoYXJhY3RlciA9PT0gdGVybWluYXRvcikge1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIHN0YXRlLnRhZyA9IF90YWc7XG4gICAgICBzdGF0ZS5raW5kID0gaXNNYXBwaW5nID8gJ21hcHBpbmcnIDogJ3NlcXVlbmNlJztcbiAgICAgIHN0YXRlLnJlc3VsdCA9IF9yZXN1bHQ7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKCFyZWFkTmV4dCkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ21pc3NlZCBjb21tYSBiZXR3ZWVuIGZsb3cgY29sbGVjdGlvbiBlbnRyaWVzJyk7XG4gICAgfVxuXG4gICAga2V5VGFnID0ga2V5Tm9kZSA9IHZhbHVlTm9kZSA9IG51bGw7XG4gICAgaXNQYWlyID0gaXNFeHBsaWNpdFBhaXIgPSBmYWxzZTtcblxuICAgIGlmIChDSEFSX1FVRVNUSU9OID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgICAgaWYgKENIQVJfU1BBQ0UgPT09IGZvbGxvd2luZyB8fFxuICAgICAgICAgIENIQVJfVEFCID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgICBDSEFSX0xJTkVfRkVFRCA9PT0gZm9sbG93aW5nIHx8XG4gICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gPT09IGZvbGxvd2luZykge1xuICAgICAgICBpc1BhaXIgPSBpc0V4cGxpY2l0UGFpciA9IHRydWU7XG4gICAgICAgIHN0YXRlLnBvc2l0aW9uICs9IDE7XG4gICAgICAgIHN0YXRlLmNoYXJhY3RlciA9IGZvbGxvd2luZztcbiAgICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgX2xpbmUgPSBzdGF0ZS5saW5lO1xuICAgIGNvbXBvc2VOb2RlKHN0YXRlLCBub2RlSW5kZW50LCBDT05URVhUX0ZMT1dfSU4sIGZhbHNlLCB0cnVlKTtcbiAgICBrZXlUYWcgPSBzdGF0ZS50YWc7XG4gICAga2V5Tm9kZSA9IHN0YXRlLnJlc3VsdDtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCBub2RlSW5kZW50KTtcblxuICAgIGlmICgoaXNFeHBsaWNpdFBhaXIgfHwgc3RhdGUubGluZSA9PT0gX2xpbmUpICYmIENIQVJfQ09MT04gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgaXNQYWlyID0gdHJ1ZTtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCBub2RlSW5kZW50KTtcbiAgICAgIGNvbXBvc2VOb2RlKHN0YXRlLCBub2RlSW5kZW50LCBDT05URVhUX0ZMT1dfSU4sIGZhbHNlLCB0cnVlKTtcbiAgICAgIHZhbHVlTm9kZSA9IHN0YXRlLnJlc3VsdDtcbiAgICB9XG5cbiAgICBpZiAoaXNNYXBwaW5nKSB7XG4gICAgICBzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBfcmVzdWx0LCBrZXlUYWcsIGtleU5vZGUsIHZhbHVlTm9kZSk7XG4gICAgfSBlbHNlIGlmIChpc1BhaXIpIHtcbiAgICAgIF9yZXN1bHQucHVzaChzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBudWxsLCBrZXlUYWcsIGtleU5vZGUsIHZhbHVlTm9kZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBfcmVzdWx0LnB1c2goa2V5Tm9kZSk7XG4gICAgfVxuXG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG5cbiAgICBpZiAoQ0hBUl9DT01NQSA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICByZWFkTmV4dCA9IHRydWU7XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWFkTmV4dCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgc3RyZWFtIHdpdGhpbiBhIGZsb3cgY29sbGVjdGlvbicpO1xufVxuXG5mdW5jdGlvbiByZWFkQmxvY2tTY2FsYXIoc3RhdGUsIG5vZGVJbmRlbnQpIHtcbiAgdmFyIGNhcHR1cmVTdGFydCxcbiAgICAgIGZvbGRpbmcsXG4gICAgICBjaG9tcGluZyAgICAgICA9IENIT01QSU5HX0NMSVAsXG4gICAgICBkZXRlY3RlZEluZGVudCA9IGZhbHNlLFxuICAgICAgdGV4dEluZGVudCAgICAgPSBub2RlSW5kZW50LFxuICAgICAgZW1wdHlMaW5lcyAgICAgPSAwLFxuICAgICAgYXRNb3JlSW5kZW50ZWQgPSBmYWxzZTtcblxuICBzd2l0Y2ggKHN0YXRlLmNoYXJhY3Rlcikge1xuICBjYXNlIENIQVJfVkVSVElDQUxfTElORTpcbiAgICBmb2xkaW5nID0gZmFsc2U7XG4gICAgYnJlYWs7XG5cbiAgY2FzZSBDSEFSX0dSRUFURVJfVEhBTjpcbiAgICBmb2xkaW5nID0gdHJ1ZTtcbiAgICBicmVhaztcblxuICBkZWZhdWx0OlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0YXRlLmtpbmQgPSAnc2NhbGFyJztcbiAgc3RhdGUucmVzdWx0ID0gJyc7XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmIChDSEFSX1BMVVMgPT09IHN0YXRlLmNoYXJhY3RlciB8fCBDSEFSX01JTlVTID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGlmIChDSE9NUElOR19DTElQID09PSBjaG9tcGluZykge1xuICAgICAgICBjaG9tcGluZyA9IChDSEFSX1BMVVMgPT09IHN0YXRlLmNoYXJhY3RlcikgPyBDSE9NUElOR19LRUVQIDogQ0hPTVBJTkdfU1RSSVA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAncmVwZWF0IG9mIGEgY2hvbXBpbmcgbW9kZSBpZGVudGlmaWVyJyk7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKENIQVJfRElHSVRfWkVSTyA8PSBzdGF0ZS5jaGFyYWN0ZXIgJiYgc3RhdGUuY2hhcmFjdGVyIDw9IENIQVJfRElHSVRfTklORSkge1xuICAgICAgaWYgKENIQVJfRElHSVRfWkVSTyA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdiYWQgZXhwbGljaXQgaW5kZW50YXRpb24gd2lkdGggb2YgYSBibG9jayBzY2FsYXI7IGl0IGNhbm5vdCBiZSBsZXNzIHRoYW4gb25lJyk7XG4gICAgICB9IGVsc2UgaWYgKCFkZXRlY3RlZEluZGVudCkge1xuICAgICAgICB0ZXh0SW5kZW50ID0gbm9kZUluZGVudCArIChzdGF0ZS5jaGFyYWN0ZXIgLSBDSEFSX0RJR0lUX09ORSk7XG4gICAgICAgIGRldGVjdGVkSW5kZW50ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdyZXBlYXQgb2YgYW4gaW5kZW50YXRpb24gd2lkdGggaWRlbnRpZmllcicpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChDSEFSX1NQQUNFID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9UQUIgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIGRvIHsgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTsgfVxuICAgIHdoaWxlIChDSEFSX1NQQUNFID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9UQUIgPT09IHN0YXRlLmNoYXJhY3Rlcik7XG5cbiAgICBpZiAoQ0hBUl9TSEFSUCA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBkbyB7IHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7IH1cbiAgICAgIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCAmJlxuICAgICAgICAgICAgIENIQVJfTElORV9GRUVEICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiAhPT0gc3RhdGUuY2hhcmFjdGVyKTtcbiAgICB9XG4gIH1cblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICByZWFkTGluZUJyZWFrKHN0YXRlKTtcbiAgICBzdGF0ZS5saW5lSW5kZW50ID0gMDtcblxuICAgIHdoaWxlICgoIWRldGVjdGVkSW5kZW50IHx8IHN0YXRlLmxpbmVJbmRlbnQgPCB0ZXh0SW5kZW50KSAmJlxuICAgICAgICAgICAoQ0hBUl9TUEFDRSA9PT0gc3RhdGUuY2hhcmFjdGVyKSkge1xuICAgICAgc3RhdGUubGluZUluZGVudCArPSAxO1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAoIWRldGVjdGVkSW5kZW50ICYmIHN0YXRlLmxpbmVJbmRlbnQgPiB0ZXh0SW5kZW50KSB7XG4gICAgICB0ZXh0SW5kZW50ID0gc3RhdGUubGluZUluZGVudDtcbiAgICB9XG5cbiAgICBpZiAoQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmNoYXJhY3RlciB8fCBDSEFSX0NBUlJJQUdFX1JFVFVSTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICBlbXB0eUxpbmVzICs9IDE7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBFbmQgb2YgdGhlIHNjYWxhci5cbiAgICBpZiAoc3RhdGUubGluZUluZGVudCA8IHRleHRJbmRlbnQpIHtcblxuICAgICAgLy8gUGVyZm9ybSB0aGUgY2hvbXBpbmcuXG4gICAgICBzd2l0Y2ggKGNob21waW5nKSB7XG4gICAgICBjYXNlIENIT01QSU5HX0tFRVA6XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBlbXB0eUxpbmVzKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgQ0hPTVBJTkdfQ0xJUDpcbiAgICAgICAgaWYgKGRldGVjdGVkSW5kZW50KSB7IC8vIGkuZS4gb25seSBpZiB0aGUgc2NhbGFyIGlzIG5vdCBlbXB0eS5cbiAgICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gJ1xcbic7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEJyZWFrIHRoaXMgYHdoaWxlYCBjeWNsZSBhbmQgZ28gdG8gdGhlIGZ1bmNpdG9uJ3MgZXBpbG9ndWUuXG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBGb2xkZWQgc3R5bGU6IHVzZSBmYW5jeSBydWxlcyB0byBoYW5kbGUgbGluZSBicmVha3MuXG4gICAgaWYgKGZvbGRpbmcpIHtcblxuICAgICAgLy8gTGluZXMgc3RhcnRpbmcgd2l0aCB3aGl0ZSBzcGFjZSBjaGFyYWN0ZXJzIChtb3JlLWluZGVudGVkIGxpbmVzKSBhcmUgbm90IGZvbGRlZC5cbiAgICAgIGlmIChDSEFSX1NQQUNFID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHwgQ0hBUl9UQUIgPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICBhdE1vcmVJbmRlbnRlZCA9IHRydWU7XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBlbXB0eUxpbmVzICsgMSk7XG5cbiAgICAgIC8vIEVuZCBvZiBtb3JlLWluZGVudGVkIGJsb2NrLlxuICAgICAgfSBlbHNlIGlmIChhdE1vcmVJbmRlbnRlZCkge1xuICAgICAgICBhdE1vcmVJbmRlbnRlZCA9IGZhbHNlO1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnXFxuJywgZW1wdHlMaW5lcyArIDEpO1xuXG4gICAgICAvLyBKdXN0IG9uZSBsaW5lIGJyZWFrIC0gcGVyY2VpdmUgYXMgdGhlIHNhbWUgbGluZS5cbiAgICAgIH0gZWxzZSBpZiAoMCA9PT0gZW1wdHlMaW5lcykge1xuICAgICAgICBpZiAoZGV0ZWN0ZWRJbmRlbnQpIHsgLy8gaS5lLiBvbmx5IGlmIHdlIGhhdmUgYWxyZWFkeSByZWFkIHNvbWUgc2NhbGFyIGNvbnRlbnQuXG4gICAgICAgICAgc3RhdGUucmVzdWx0ICs9ICcgJztcbiAgICAgICAgfVxuXG4gICAgICAvLyBTZXZlcmFsIGxpbmUgYnJlYWtzIC0gcGVyY2VpdmUgYXMgZGlmZmVyZW50IGxpbmVzLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJ1xcbicsIGVtcHR5TGluZXMpO1xuICAgICAgfVxuXG4gICAgLy8gTGl0ZXJhbCBzdHlsZToganVzdCBhZGQgZXhhY3QgbnVtYmVyIG9mIGxpbmUgYnJlYWtzIGJldHdlZW4gY29udGVudCBsaW5lcy5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBJZiBjdXJyZW50IGxpbmUgaXNuJ3QgdGhlIGZpcnN0IG9uZSAtIGNvdW50IGxpbmUgYnJlYWsgZnJvbSB0aGUgbGFzdCBjb250ZW50IGxpbmUuXG4gICAgICBpZiAoZGV0ZWN0ZWRJbmRlbnQpIHtcbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJ1xcbicsIGVtcHR5TGluZXMgKyAxKTtcblxuICAgICAgLy8gSW4gY2FzZSBvZiB0aGUgZmlyc3QgY29udGVudCBsaW5lIC0gY291bnQgb25seSBlbXB0eSBsaW5lcy5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBlbXB0eUxpbmVzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBkZXRlY3RlZEluZGVudCA9IHRydWU7XG4gICAgZW1wdHlMaW5lcyA9IDA7XG4gICAgY2FwdHVyZVN0YXJ0ID0gc3RhdGUucG9zaXRpb247XG5cbiAgICBkbyB7IHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7IH1cbiAgICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGggJiZcbiAgICAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiAhPT0gc3RhdGUuY2hhcmFjdGVyKTtcblxuICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIHN0YXRlLnBvc2l0aW9uLCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gcmVhZEJsb2NrU2VxdWVuY2Uoc3RhdGUsIG5vZGVJbmRlbnQpIHtcbiAgdmFyIF9saW5lLFxuICAgICAgX3RhZyAgICAgID0gc3RhdGUudGFnLFxuICAgICAgX3Jlc3VsdCAgID0gW10sXG4gICAgICBmb2xsb3dpbmcsXG4gICAgICBkZXRlY3RlZCAgPSBmYWxzZTtcblxuICBpZiAobnVsbCAhPT0gc3RhdGUuYW5jaG9yKSB7XG4gICAgc3RhdGUuYW5jaG9yTWFwW3N0YXRlLmFuY2hvcl0gPSBfcmVzdWx0O1xuICB9XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgaWYgKENIQVJfTUlOVVMgIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgZm9sbG93aW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgaWYgKENIQVJfU1BBQ0UgICAgICAgICAgICE9PSBmb2xsb3dpbmcgJiZcbiAgICAgICAgQ0hBUl9UQUIgICAgICAgICAgICAgIT09IGZvbGxvd2luZyAmJlxuICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAhPT0gZm9sbG93aW5nICYmXG4gICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOICE9PSBmb2xsb3dpbmcpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGRldGVjdGVkID0gdHJ1ZTtcbiAgICBzdGF0ZS5wb3NpdGlvbiArPSAxO1xuICAgIHN0YXRlLmNoYXJhY3RlciA9IGZvbGxvd2luZztcblxuICAgIGlmIChza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSkpIHtcbiAgICAgIGlmIChzdGF0ZS5saW5lSW5kZW50IDw9IG5vZGVJbmRlbnQpIHtcbiAgICAgICAgX3Jlc3VsdC5wdXNoKG51bGwpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBfbGluZSA9IHN0YXRlLmxpbmU7XG4gICAgY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfQkxPQ0tfSU4sIGZhbHNlLCB0cnVlKTtcbiAgICBfcmVzdWx0LnB1c2goc3RhdGUucmVzdWx0KTtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG5cbiAgICBpZiAoKHN0YXRlLmxpbmUgPT09IF9saW5lIHx8IHN0YXRlLmxpbmVJbmRlbnQgPiBub2RlSW5kZW50KSAmJiBzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2JhZCBpbmRlbnRhdGlvbiBvZiBhIHNlcXVlbmNlIGVudHJ5Jyk7XG4gICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50IDwgbm9kZUluZGVudCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRldGVjdGVkKSB7XG4gICAgc3RhdGUudGFnID0gX3RhZztcbiAgICBzdGF0ZS5raW5kID0gJ3NlcXVlbmNlJztcbiAgICBzdGF0ZS5yZXN1bHQgPSBfcmVzdWx0O1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkQmxvY2tNYXBwaW5nKHN0YXRlLCBub2RlSW5kZW50KSB7XG4gIHZhciBmb2xsb3dpbmcsXG4gICAgICBhbGxvd0NvbXBhY3QsXG4gICAgICBfbGluZSxcbiAgICAgIF90YWcgICAgICAgICAgPSBzdGF0ZS50YWcsXG4gICAgICBfcmVzdWx0ICAgICAgID0ge30sXG4gICAgICBrZXlUYWcgICAgICAgID0gbnVsbCxcbiAgICAgIGtleU5vZGUgICAgICAgPSBudWxsLFxuICAgICAgdmFsdWVOb2RlICAgICA9IG51bGwsXG4gICAgICBhdEV4cGxpY2l0S2V5ID0gZmFsc2UsXG4gICAgICBkZXRlY3RlZCAgICAgID0gZmFsc2U7XG5cbiAgaWYgKG51bGwgIT09IHN0YXRlLmFuY2hvcikge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gX3Jlc3VsdDtcbiAgfVxuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcbiAgICBfbGluZSA9IHN0YXRlLmxpbmU7IC8vIFNhdmUgdGhlIGN1cnJlbnQgbGluZS5cblxuICAgIC8vXG4gICAgLy8gRXhwbGljaXQgbm90YXRpb24gY2FzZS4gVGhlcmUgYXJlIHR3byBzZXBhcmF0ZSBibG9ja3M6XG4gICAgLy8gZmlyc3QgZm9yIHRoZSBrZXkgKGRlbm90ZWQgYnkgXCI/XCIpIGFuZCBzZWNvbmQgZm9yIHRoZSB2YWx1ZSAoZGVub3RlZCBieSBcIjpcIilcbiAgICAvL1xuICAgIGlmICgoQ0hBUl9RVUVTVElPTiAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlciB8fFxuICAgICAgICAgQ0hBUl9DT0xPTiAgICAgICAgICAgPT09IHN0YXRlLmNoYXJhY3RlcikgJiZcbiAgICAgICAgKENIQVJfU1BBQ0UgICAgICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgIENIQVJfVEFCICAgICAgICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgIENIQVJfTElORV9GRUVEICAgICAgID09PSBmb2xsb3dpbmcgfHxcbiAgICAgICAgIENIQVJfQ0FSUklBR0VfUkVUVVJOID09PSBmb2xsb3dpbmcpKSB7XG5cbiAgICAgIGlmIChDSEFSX1FVRVNUSU9OID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgaWYgKGF0RXhwbGljaXRLZXkpIHtcbiAgICAgICAgICBzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBfcmVzdWx0LCBrZXlUYWcsIGtleU5vZGUsIG51bGwpO1xuICAgICAgICAgIGtleVRhZyA9IGtleU5vZGUgPSB2YWx1ZU5vZGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICBhdEV4cGxpY2l0S2V5ID0gdHJ1ZTtcbiAgICAgICAgYWxsb3dDb21wYWN0ID0gdHJ1ZTtcblxuICAgICAgfSBlbHNlIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgIC8vIGkuZS4gQ0hBUl9DT0xPTiA9PT0gY2hhcmFjdGVyIGFmdGVyIHRoZSBleHBsaWNpdCBrZXkuXG4gICAgICAgIGF0RXhwbGljaXRLZXkgPSBmYWxzZTtcbiAgICAgICAgYWxsb3dDb21wYWN0ID0gdHJ1ZTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2luY29tcGxldGUgZXhwbGljaXQgbWFwcGluZyBwYWlyOyBhIGtleSBub2RlIGlzIG1pc3NlZCcpO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS5wb3NpdGlvbiArPSAxO1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gZm9sbG93aW5nO1xuXG4gICAgLy9cbiAgICAvLyBJbXBsaWNpdCBub3RhdGlvbiBjYXNlLiBGbG93LXN0eWxlIG5vZGUgYXMgdGhlIGtleSBmaXJzdCwgdGhlbiBcIjpcIiwgYW5kIHRoZSB2YWx1ZS5cbiAgICAvL1xuICAgIH0gZWxzZSBpZiAoY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfRkxPV19PVVQsIGZhbHNlLCB0cnVlKSkge1xuICAgICAgaWYgKHN0YXRlLmxpbmUgPT09IF9saW5lKSB7XG4gICAgICAgIHdoaWxlIChDSEFSX1NQQUNFID09PSBzdGF0ZS5jaGFyYWN0ZXIgfHxcbiAgICAgICAgICAgICAgIENIQVJfVEFCID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKENIQVJfQ09MT04gPT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICAgICAgICBpZiAoQ0hBUl9TUEFDRSAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgICAgIENIQVJfTElORV9GRUVEICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2Egd2hpdGVzcGFjZSBjaGFyYWN0ZXIgaXMgZXhwZWN0ZWQgYWZ0ZXIgdGhlIGtleS12YWx1ZSBzZXBhcmF0b3Igd2l0aGluIGEgYmxvY2sgbWFwcGluZycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgICAgICBzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBfcmVzdWx0LCBrZXlUYWcsIGtleU5vZGUsIG51bGwpO1xuICAgICAgICAgICAga2V5VGFnID0ga2V5Tm9kZSA9IHZhbHVlTm9kZSA9IG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgIGF0RXhwbGljaXRLZXkgPSBmYWxzZTtcbiAgICAgICAgICBhbGxvd0NvbXBhY3QgPSBmYWxzZTtcbiAgICAgICAgICBrZXlUYWcgPSBzdGF0ZS50YWc7XG4gICAgICAgICAga2V5Tm9kZSA9IHN0YXRlLnJlc3VsdDtcblxuICAgICAgICB9IGVsc2UgaWYgKGRldGVjdGVkKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2NhbiBub3QgcmVhZCBhbiBpbXBsaWNpdCBtYXBwaW5nIHBhaXI7IGEgY29sb24gaXMgbWlzc2VkJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBLZWVwIHRoZSByZXN1bHQgb2YgYGNvbXBvc2VOb2RlYC5cbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2UgaWYgKGRldGVjdGVkKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdjYW4gbm90IHJlYWQgYSBibG9jayBtYXBwaW5nIGVudHJ5OyBhIG11bHRpbGluZSBrZXkgbWF5IG5vdCBiZSBhbiBpbXBsaWNpdCBrZXknKTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUudGFnID0gX3RhZztcbiAgICAgICAgcmV0dXJuIHRydWU7IC8vIEtlZXAgdGhlIHJlc3VsdCBvZiBgY29tcG9zZU5vZGVgLlxuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrOyAvLyBSZWFkaW5nIGlzIGRvbmUuIEdvIHRvIHRoZSBlcGlsb2d1ZS5cbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIENvbW1vbiByZWFkaW5nIGNvZGUgZm9yIGJvdGggZXhwbGljaXQgYW5kIGltcGxpY2l0IG5vdGF0aW9ucy5cbiAgICAvL1xuICAgIGlmIChzdGF0ZS5saW5lID09PSBfbGluZSB8fCBzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCkge1xuICAgICAgaWYgKGNvbXBvc2VOb2RlKHN0YXRlLCBub2RlSW5kZW50LCBDT05URVhUX0JMT0NLX09VVCwgdHJ1ZSwgYWxsb3dDb21wYWN0KSkge1xuICAgICAgICBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgICAgICAgIGtleU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWVOb2RlID0gc3RhdGUucmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghYXRFeHBsaWNpdEtleSkge1xuICAgICAgICBzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBfcmVzdWx0LCBrZXlUYWcsIGtleU5vZGUsIHZhbHVlTm9kZSk7XG4gICAgICAgIGtleVRhZyA9IGtleU5vZGUgPSB2YWx1ZU5vZGUgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPiBub2RlSW5kZW50ICYmIHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnYmFkIGluZGVudGF0aW9uIG9mIGEgbWFwcGluZyBlbnRyeScpO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA8IG5vZGVJbmRlbnQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIEVwaWxvZ3VlLlxuICAvL1xuXG4gIC8vIFNwZWNpYWwgY2FzZTogbGFzdCBtYXBwaW5nJ3Mgbm9kZSBjb250YWlucyBvbmx5IHRoZSBrZXkgaW4gZXhwbGljaXQgbm90YXRpb24uXG4gIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgX3Jlc3VsdCwga2V5VGFnLCBrZXlOb2RlLCBudWxsKTtcbiAgfVxuXG4gIC8vIEV4cG9zZSB0aGUgcmVzdWx0aW5nIG1hcHBpbmcuXG4gIGlmIChkZXRlY3RlZCkge1xuICAgIHN0YXRlLnRhZyA9IF90YWc7XG4gICAgc3RhdGUua2luZCA9ICdtYXBwaW5nJztcbiAgICBzdGF0ZS5yZXN1bHQgPSBfcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIGRldGVjdGVkO1xufVxuXG5mdW5jdGlvbiByZWFkVGFnUHJvcGVydHkoc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbixcbiAgICAgIGlzVmVyYmF0aW0gPSBmYWxzZSxcbiAgICAgIGlzTmFtZWQgICAgPSBmYWxzZSxcbiAgICAgIHRhZ0hhbmRsZSxcbiAgICAgIHRhZ05hbWU7XG5cbiAgaWYgKENIQVJfRVhDTEFNQVRJT04gIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChudWxsICE9PSBzdGF0ZS50YWcpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZHVwbGljYXRpb24gb2YgYSB0YWcgcHJvcGVydHknKTtcbiAgfVxuXG4gIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKENIQVJfTEVTU19USEFOID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICBpc1ZlcmJhdGltID0gdHJ1ZTtcbiAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gIH0gZWxzZSBpZiAoQ0hBUl9FWENMQU1BVElPTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgaXNOYW1lZCA9IHRydWU7XG4gICAgdGFnSGFuZGxlID0gJyEhJztcbiAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gIH0gZWxzZSB7XG4gICAgdGFnSGFuZGxlID0gJyEnO1xuICB9XG5cbiAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgaWYgKGlzVmVyYmF0aW0pIHtcbiAgICBkbyB7IHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7IH1cbiAgICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGggJiYgQ0hBUl9HUkVBVEVSX1RIQU4gIT09IHN0YXRlLmNoYXJhY3Rlcik7XG5cbiAgICBpZiAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICAgIHRhZ05hbWUgPSBzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24sIHN0YXRlLnBvc2l0aW9uKTtcbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgc3RyZWFtIHdpdGhpbiBhIHZlcmJhdGltIHRhZycpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGggJiZcbiAgICAgICAgICAgQ0hBUl9TUEFDRSAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgIENIQVJfTElORV9GRUVEICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuXG4gICAgICBpZiAoQ0hBUl9FWENMQU1BVElPTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgIGlmICghaXNOYW1lZCkge1xuICAgICAgICAgIHRhZ0hhbmRsZSA9IHN0YXRlLmlucHV0LnNsaWNlKF9wb3NpdGlvbiAtIDEsIHN0YXRlLnBvc2l0aW9uICsgMSk7XG5cbiAgICAgICAgICBpZiAoIVBBVFRFUk5fVEFHX0hBTkRMRS50ZXN0KHRhZ0hhbmRsZSkpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICduYW1lZCB0YWcgaGFuZGxlIGNhbm5vdCBjb250YWluIHN1Y2ggY2hhcmFjdGVycycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlzTmFtZWQgPSB0cnVlO1xuICAgICAgICAgIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uICsgMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndGFnIHN1ZmZpeCBjYW5ub3QgY29udGFpbiBleGNsYW1hdGlvbiBtYXJrcycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgdGFnTmFtZSA9IHN0YXRlLmlucHV0LnNsaWNlKF9wb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pO1xuXG4gICAgaWYgKFBBVFRFUk5fRkxPV19JTkRJQ0FUT1JTLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd0YWcgc3VmZml4IGNhbm5vdCBjb250YWluIGZsb3cgaW5kaWNhdG9yIGNoYXJhY3RlcnMnKTtcbiAgICB9XG4gIH1cblxuICBpZiAodGFnTmFtZSAmJiAhUEFUVEVSTl9UQUdfVVJJLnRlc3QodGFnTmFtZSkpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAndGFnIG5hbWUgY2Fubm90IGNvbnRhaW4gc3VjaCBjaGFyYWN0ZXJzOiAnICsgdGFnTmFtZSk7XG4gIH1cblxuICBpZiAoaXNWZXJiYXRpbSkge1xuICAgIHN0YXRlLnRhZyA9IHRhZ05hbWU7XG5cbiAgfSBlbHNlIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbChzdGF0ZS50YWdNYXAsIHRhZ0hhbmRsZSkpIHtcbiAgICBzdGF0ZS50YWcgPSBzdGF0ZS50YWdNYXBbdGFnSGFuZGxlXSArIHRhZ05hbWU7XG5cbiAgfSBlbHNlIGlmICgnIScgPT09IHRhZ0hhbmRsZSkge1xuICAgIHN0YXRlLnRhZyA9ICchJyArIHRhZ05hbWU7XG5cbiAgfSBlbHNlIGlmICgnISEnID09PSB0YWdIYW5kbGUpIHtcbiAgICBzdGF0ZS50YWcgPSAndGFnOnlhbWwub3JnLDIwMDI6JyArIHRhZ05hbWU7XG5cbiAgfSBlbHNlIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5kZWNsYXJlZCB0YWcgaGFuZGxlIFwiJyArIHRhZ0hhbmRsZSArICdcIicpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlYWRBbmNob3JQcm9wZXJ0eShzdGF0ZSkge1xuICB2YXIgX3Bvc2l0aW9uO1xuXG4gIGlmIChDSEFSX0FNUEVSU0FORCAhPT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKG51bGwgIT09IHN0YXRlLmFuY2hvcikge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdkdXBsaWNhdGlvbiBvZiBhbiBhbmNob3IgcHJvcGVydHknKTtcbiAgfVxuXG4gIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCAmJlxuICAgICAgICAgQ0hBUl9TUEFDRSAgICAgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfTElORV9GRUVEICAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX0NPTU1BICAgICAgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVCAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCAgIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIH1cblxuICBpZiAoc3RhdGUucG9zaXRpb24gPT09IF9wb3NpdGlvbikge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICduYW1lIG9mIGFuIGFuY2hvciBub2RlIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgY2hhcmFjdGVyJyk7XG4gIH1cblxuICBzdGF0ZS5hbmNob3IgPSBzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24sIHN0YXRlLnBvc2l0aW9uKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlYWRBbGlhcyhzdGF0ZSkge1xuICB2YXIgX3Bvc2l0aW9uLCBhbGlhcztcblxuICBpZiAoQ0hBUl9BU1RFUklTSyAhPT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoICYmXG4gICAgICAgICBDSEFSX1NQQUNFICAgICAgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfVEFCICAgICAgICAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX0NBUlJJQUdFX1JFVFVSTiAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfQ09NTUEgICAgICAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgIENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICAhPT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgfVxuXG4gIGlmIChzdGF0ZS5wb3NpdGlvbiA9PT0gX3Bvc2l0aW9uKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ25hbWUgb2YgYW4gYWxpYXMgbm9kZSBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGNoYXJhY3RlcicpO1xuICB9XG5cbiAgYWxpYXMgPSBzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24sIHN0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoIXN0YXRlLmFuY2hvck1hcC5oYXNPd25Qcm9wZXJ0eShhbGlhcykpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5pZGVudGlmaWVkIGFsaWFzIFwiJyArIGFsaWFzICsgJ1wiJyk7XG4gIH1cblxuICBzdGF0ZS5yZXN1bHQgPSBzdGF0ZS5hbmNob3JNYXBbYWxpYXNdO1xuICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjb21wb3NlTm9kZShzdGF0ZSwgcGFyZW50SW5kZW50LCBub2RlQ29udGV4dCwgYWxsb3dUb1NlZWssIGFsbG93Q29tcGFjdCkge1xuICB2YXIgYWxsb3dCbG9ja1N0eWxlcyxcbiAgICAgIGFsbG93QmxvY2tTY2FsYXJzLFxuICAgICAgYWxsb3dCbG9ja0NvbGxlY3Rpb25zLFxuICAgICAgYXROZXdMaW5lICA9IGZhbHNlLFxuICAgICAgaXNJbmRlbnRlZCA9IHRydWUsXG4gICAgICBoYXNDb250ZW50ID0gZmFsc2UsXG4gICAgICB0eXBlSW5kZXgsXG4gICAgICB0eXBlUXVhbnRpdHksXG4gICAgICB0eXBlLFxuICAgICAgZmxvd0luZGVudCxcbiAgICAgIGJsb2NrSW5kZW50LFxuICAgICAgX3Jlc3VsdDtcblxuICBzdGF0ZS50YWcgICAgPSBudWxsO1xuICBzdGF0ZS5hbmNob3IgPSBudWxsO1xuICBzdGF0ZS5raW5kICAgPSBudWxsO1xuICBzdGF0ZS5yZXN1bHQgPSBudWxsO1xuXG4gIGFsbG93QmxvY2tTdHlsZXMgPSBhbGxvd0Jsb2NrU2NhbGFycyA9IGFsbG93QmxvY2tDb2xsZWN0aW9ucyA9XG4gICAgQ09OVEVYVF9CTE9DS19PVVQgPT09IG5vZGVDb250ZXh0IHx8XG4gICAgQ09OVEVYVF9CTE9DS19JTiAgPT09IG5vZGVDb250ZXh0O1xuXG4gIGlmIChhbGxvd1RvU2Vlaykge1xuICAgIGlmIChza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSkpIHtcbiAgICAgIGF0TmV3TGluZSA9IHRydWU7XG5cbiAgICAgIGlmIChzdGF0ZS5saW5lSW5kZW50ID09PSBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgaXNJbmRlbnRlZCA9IGZhbHNlO1xuXG4gICAgICB9IGVsc2UgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPiBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgaXNJbmRlbnRlZCA9IHRydWU7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaXNJbmRlbnRlZCkge1xuICAgIHdoaWxlIChyZWFkVGFnUHJvcGVydHkoc3RhdGUpIHx8IHJlYWRBbmNob3JQcm9wZXJ0eShzdGF0ZSkpIHtcbiAgICAgIGlmIChza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSkpIHtcbiAgICAgICAgYXROZXdMaW5lID0gdHJ1ZTtcblxuICAgICAgICBpZiAoc3RhdGUubGluZUluZGVudCA+IHBhcmVudEluZGVudCkge1xuICAgICAgICAgIGlzSW5kZW50ZWQgPSB0cnVlO1xuICAgICAgICAgIGFsbG93QmxvY2tDb2xsZWN0aW9ucyA9IGFsbG93QmxvY2tTdHlsZXM7XG5cbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50ID09PSBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgICBpc0luZGVudGVkID0gZmFsc2U7XG4gICAgICAgICAgYWxsb3dCbG9ja0NvbGxlY3Rpb25zID0gYWxsb3dCbG9ja1N0eWxlcztcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoYWxsb3dCbG9ja0NvbGxlY3Rpb25zKSB7XG4gICAgYWxsb3dCbG9ja0NvbGxlY3Rpb25zID0gYXROZXdMaW5lIHx8IGFsbG93Q29tcGFjdDtcbiAgfVxuXG4gIGlmIChpc0luZGVudGVkIHx8IENPTlRFWFRfQkxPQ0tfT1VUID09PSBub2RlQ29udGV4dCkge1xuICAgIGlmIChDT05URVhUX0ZMT1dfSU4gPT09IG5vZGVDb250ZXh0IHx8IENPTlRFWFRfRkxPV19PVVQgPT09IG5vZGVDb250ZXh0KSB7XG4gICAgICBmbG93SW5kZW50ID0gcGFyZW50SW5kZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBmbG93SW5kZW50ID0gcGFyZW50SW5kZW50ICsgMTtcbiAgICB9XG5cbiAgICBibG9ja0luZGVudCA9IHN0YXRlLnBvc2l0aW9uIC0gc3RhdGUubGluZVN0YXJ0O1xuXG4gICAgaWYgKGlzSW5kZW50ZWQpIHtcbiAgICAgIGlmIChhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgJiZcbiAgICAgICAgICAocmVhZEJsb2NrU2VxdWVuY2Uoc3RhdGUsIGJsb2NrSW5kZW50KSB8fFxuICAgICAgICAgICByZWFkQmxvY2tNYXBwaW5nKHN0YXRlLCBibG9ja0luZGVudCkpIHx8XG4gICAgICAgICAgcmVhZEZsb3dDb2xsZWN0aW9uKHN0YXRlLCBmbG93SW5kZW50KSkge1xuICAgICAgICBoYXNDb250ZW50ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgoYWxsb3dCbG9ja1NjYWxhcnMgJiYgcmVhZEJsb2NrU2NhbGFyKHN0YXRlLCBmbG93SW5kZW50KSkgfHxcbiAgICAgICAgICAgIHJlYWRTaW5nbGVRdW90ZWRTY2FsYXIoc3RhdGUsIGZsb3dJbmRlbnQpIHx8XG4gICAgICAgICAgICByZWFkRG91YmxlUXVvdGVkU2NhbGFyKHN0YXRlLCBmbG93SW5kZW50KSkge1xuICAgICAgICAgIGhhc0NvbnRlbnQgPSB0cnVlO1xuXG4gICAgICAgIH0gZWxzZSBpZiAocmVhZEFsaWFzKHN0YXRlKSkge1xuICAgICAgICAgIGhhc0NvbnRlbnQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKG51bGwgIT09IHN0YXRlLnRhZyB8fCBudWxsICE9PSBzdGF0ZS5hbmNob3IpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdhbGlhcyBub2RlIHNob3VsZCBub3QgaGF2ZSBhbnkgcHJvcGVydGllcycpO1xuICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2UgaWYgKHJlYWRQbGFpblNjYWxhcihzdGF0ZSwgZmxvd0luZGVudCwgQ09OVEVYVF9GTE9XX0lOID09PSBub2RlQ29udGV4dCkpIHtcbiAgICAgICAgICBoYXNDb250ZW50ID0gdHJ1ZTtcblxuICAgICAgICAgIGlmIChudWxsID09PSBzdGF0ZS50YWcpIHtcbiAgICAgICAgICAgIHN0YXRlLnRhZyA9ICc/JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobnVsbCAhPT0gc3RhdGUuYW5jaG9yKSB7XG4gICAgICAgICAgc3RhdGUuYW5jaG9yTWFwW3N0YXRlLmFuY2hvcl0gPSBzdGF0ZS5yZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaGFzQ29udGVudCA9IGFsbG93QmxvY2tDb2xsZWN0aW9ucyAmJiByZWFkQmxvY2tTZXF1ZW5jZShzdGF0ZSwgYmxvY2tJbmRlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChudWxsICE9PSBzdGF0ZS50YWcgJiYgJyEnICE9PSBzdGF0ZS50YWcpIHtcbiAgICBpZiAoJz8nID09PSBzdGF0ZS50YWcpIHtcbiAgICAgIGZvciAodHlwZUluZGV4ID0gMCwgdHlwZVF1YW50aXR5ID0gc3RhdGUuaW1wbGljaXRUeXBlcy5sZW5ndGg7XG4gICAgICAgICAgIHR5cGVJbmRleCA8IHR5cGVRdWFudGl0eTtcbiAgICAgICAgICAgdHlwZUluZGV4ICs9IDEpIHtcbiAgICAgICAgdHlwZSA9IHN0YXRlLmltcGxpY2l0VHlwZXNbdHlwZUluZGV4XTtcblxuICAgICAgICAvLyBJbXBsaWNpdCByZXNvbHZpbmcgaXMgbm90IGFsbG93ZWQgZm9yIG5vbi1zY2FsYXIgdHlwZXMsIGFuZCAnPydcbiAgICAgICAgLy8gbm9uLXNwZWNpZmljIHRhZyBpcyBvbmx5IGFzc2lnbmVkIHRvIHBsYWluIHNjYWxhcnMuIFNvLCBpdCBpc24ndFxuICAgICAgICAvLyBuZWVkZWQgdG8gY2hlY2sgZm9yICdraW5kJyBjb25mb3JtaXR5LlxuXG4gICAgICAgIGlmICh0eXBlLmxvYWRSZXNvbHZlciAmJiB0eXBlLmxvYWRSZXNvbHZlcihzdGF0ZSkpIHsgLy8gYHN0YXRlLnJlc3VsdGAgdXBkYXRlZCBpbiByZXNvbHZlciBpZiBtYXRjaGVkXG4gICAgICAgICAgc3RhdGUudGFnID0gdHlwZS50YWc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoX2hhc093blByb3BlcnR5LmNhbGwoc3RhdGUudHlwZU1hcCwgc3RhdGUudGFnKSkge1xuICAgICAgdHlwZSA9IHN0YXRlLnR5cGVNYXBbc3RhdGUudGFnXTtcblxuICAgICAgaWYgKG51bGwgIT09IHN0YXRlLnJlc3VsdCAmJiB0eXBlLmxvYWRLaW5kICE9PSBzdGF0ZS5raW5kKSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmFjY2VwdGFibGUgbm9kZSBraW5kIGZvciAhPCcgKyBzdGF0ZS50YWcgKyAnPiB0YWc7IGl0IHNob3VsZCBiZSBcIicgKyB0eXBlLmxvYWRLaW5kICsgJ1wiLCBub3QgXCInICsgc3RhdGUua2luZCArICdcIicpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZS5sb2FkUmVzb2x2ZXIgJiYgIXR5cGUubG9hZFJlc29sdmVyKHN0YXRlKSkgeyAvLyBgc3RhdGUucmVzdWx0YCB1cGRhdGVkIGluIHJlc29sdmVyIGlmIG1hdGNoZWRcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2Nhbm5vdCByZXNvbHZlIGEgbm9kZSB3aXRoICE8JyArIHN0YXRlLnRhZyArICc+IGV4cGxpY2l0IHRhZycpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvd1dhcm5pbmcoc3RhdGUsICd1bmtub3duIHRhZyAhPCcgKyBzdGF0ZS50YWcgKyAnPicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsICE9PSBzdGF0ZS50YWcgfHwgbnVsbCAhPT0gc3RhdGUuYW5jaG9yIHx8IGhhc0NvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIHJlYWREb2N1bWVudChzdGF0ZSwgaXRlcmF0b3IpIHtcbiAgdmFyIGRvY3VtZW50U3RhcnQgPSBzdGF0ZS5wb3NpdGlvbixcbiAgICAgIF9wb3NpdGlvbixcbiAgICAgIGRpcmVjdGl2ZU5hbWUsXG4gICAgICBkaXJlY3RpdmVBcmdzLFxuICAgICAgaGFzRGlyZWN0aXZlcyA9IGZhbHNlO1xuXG4gIHN0YXRlLnZlcnNpb24gPSBudWxsO1xuICBzdGF0ZS5jaGVja0xpbmVCcmVha3MgPSBzdGF0ZS5sZWdhY3k7XG4gIHN0YXRlLnRhZ01hcCA9IHt9O1xuICBzdGF0ZS5hbmNob3JNYXAgPSB7fTtcblxuICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG5cbiAgICBpZiAoc3RhdGUubGluZUluZGVudCA+IDAgfHwgQ0hBUl9QRVJDRU5UICE9PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGhhc0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgICB3aGlsZSAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGggJiZcbiAgICAgICAgICAgQ0hBUl9TUEFDRSAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICBDSEFSX1RBQiAgICAgICAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgIENIQVJfTElORV9GRUVEICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBkaXJlY3RpdmVOYW1lID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gICAgZGlyZWN0aXZlQXJncyA9IFtdO1xuXG4gICAgaWYgKGRpcmVjdGl2ZU5hbWUubGVuZ3RoIDwgMSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2RpcmVjdGl2ZSBuYW1lIG11c3Qgbm90IGJlIGxlc3MgdGhhbiBvbmUgY2hhcmFjdGVyIGluIGxlbmd0aCcpO1xuICAgIH1cblxuICAgIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgICAgd2hpbGUgKENIQVJfU1BBQ0UgPT09IHN0YXRlLmNoYXJhY3RlciB8fCBDSEFSX1RBQiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgIHN0YXRlLmNoYXJhY3RlciA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChDSEFSX1NIQVJQID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgICAgZG8geyBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pOyB9XG4gICAgICAgIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgQ0hBUl9MSU5FX0ZFRUQgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gIT09IHN0YXRlLmNoYXJhY3Rlcik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmNoYXJhY3RlciB8fCBDSEFSX0NBUlJJQUdFX1JFVFVSTiA9PT0gc3RhdGUuY2hhcmFjdGVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBfcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbjtcblxuICAgICAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoICYmXG4gICAgICAgICAgICAgQ0hBUl9TUEFDRSAgICAgICAgICAgIT09IHN0YXRlLmNoYXJhY3RlciAmJlxuICAgICAgICAgICAgIENIQVJfVEFCICAgICAgICAgICAgICE9PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgICAgICAgICBDSEFSX0xJTkVfRkVFRCAgICAgICAhPT0gc3RhdGUuY2hhcmFjdGVyICYmXG4gICAgICAgICAgICAgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gIT09IHN0YXRlLmNoYXJhY3Rlcikge1xuICAgICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgfVxuXG4gICAgICBkaXJlY3RpdmVBcmdzLnB1c2goc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbikpO1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgICAgcmVhZExpbmVCcmVhayhzdGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKGRpcmVjdGl2ZUhhbmRsZXJzLCBkaXJlY3RpdmVOYW1lKSkge1xuICAgICAgZGlyZWN0aXZlSGFuZGxlcnNbZGlyZWN0aXZlTmFtZV0oc3RhdGUsIGRpcmVjdGl2ZU5hbWUsIGRpcmVjdGl2ZUFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvd1dhcm5pbmcoc3RhdGUsICd1bmtub3duIGRvY3VtZW50IGRpcmVjdGl2ZSBcIicgKyBkaXJlY3RpdmVOYW1lICsgJ1wiJyk7XG4gICAgfVxuICB9XG5cbiAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gIGlmICgwID09PSBzdGF0ZS5saW5lSW5kZW50ICYmXG4gICAgICBDSEFSX01JTlVTID09PSBzdGF0ZS5jaGFyYWN0ZXIgJiZcbiAgICAgIENIQVJfTUlOVVMgPT09IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKSAmJlxuICAgICAgQ0hBUl9NSU5VUyA9PT0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDIpKSB7XG4gICAgc3RhdGUucG9zaXRpb24gKz0gMztcbiAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG5cbiAgfSBlbHNlIGlmIChoYXNEaXJlY3RpdmVzKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2RpcmVjdGl2ZXMgZW5kIG1hcmsgaXMgZXhwZWN0ZWQnKTtcbiAgfVxuXG4gIGNvbXBvc2VOb2RlKHN0YXRlLCBzdGF0ZS5saW5lSW5kZW50IC0gMSwgQ09OVEVYVF9CTE9DS19PVVQsIGZhbHNlLCB0cnVlKTtcbiAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gIGlmIChzdGF0ZS5jaGVja0xpbmVCcmVha3MgJiZcbiAgICAgIFBBVFRFUk5fTk9OX0FTQ0lJX0xJTkVfQlJFQUtTLnRlc3Qoc3RhdGUuaW5wdXQuc2xpY2UoZG9jdW1lbnRTdGFydCwgc3RhdGUucG9zaXRpb24pKSkge1xuICAgIHRocm93V2FybmluZyhzdGF0ZSwgJ25vbi1BU0NJSSBsaW5lIGJyZWFrcyBhcmUgaW50ZXJwcmV0ZWQgYXMgY29udGVudCcpO1xuICB9XG5cbiAgaXRlcmF0b3Ioc3RhdGUucmVzdWx0KTtcblxuICBpZiAoc3RhdGUucG9zaXRpb24gPT09IHN0YXRlLmxpbmVTdGFydCAmJiB0ZXN0RG9jdW1lbnRTZXBhcmF0b3Ioc3RhdGUpKSB7XG4gICAgaWYgKENIQVJfRE9UID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uICs9IDM7XG4gICAgICBzdGF0ZS5jaGFyYWN0ZXIgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcbiAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2VuZCBvZiB0aGUgc3RyZWFtIG9yIGEgZG9jdW1lbnQgc2VwYXJhdG9yIGlzIGV4cGVjdGVkJyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cblxuXG5mdW5jdGlvbiBsb2FkQWxsKGlucHV0LCBpdGVyYXRvciwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgc3RhdGUgPSBuZXcgU3RhdGUoaW5wdXQsIG9wdGlvbnMpO1xuXG4gIGlmIChQQVRURVJOX05PTl9QUklOVEFCTEUudGVzdChzdGF0ZS5pbnB1dCkpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAndGhlIHN0cmVhbSBjb250YWlucyBub24tcHJpbnRhYmxlIGNoYXJhY3RlcnMnKTtcbiAgfVxuXG4gIHdoaWxlIChDSEFSX1NQQUNFID09PSBzdGF0ZS5jaGFyYWN0ZXIpIHtcbiAgICBzdGF0ZS5saW5lSW5kZW50ICs9IDE7XG4gICAgc3RhdGUuY2hhcmFjdGVyID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgfVxuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCkge1xuICAgIHJlYWREb2N1bWVudChzdGF0ZSwgaXRlcmF0b3IpO1xuICB9XG59XG5cblxuZnVuY3Rpb24gbG9hZChpbnB1dCwgb3B0aW9ucykge1xuICB2YXIgcmVzdWx0ID0gbnVsbCwgcmVjZWl2ZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBpdGVyYXRvcihkYXRhKSB7XG4gICAgaWYgKCFyZWNlaXZlZCkge1xuICAgICAgcmVzdWx0ID0gZGF0YTtcbiAgICAgIHJlY2VpdmVkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFlBTUxFeGNlcHRpb24oJ2V4cGVjdGVkIGEgc2luZ2xlIGRvY3VtZW50IGluIHRoZSBzdHJlYW0sIGJ1dCBmb3VuZCBtb3JlJyk7XG4gICAgfVxuICB9XG5cbiAgbG9hZEFsbChpbnB1dCwgaXRlcmF0b3IsIG9wdGlvbnMpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuZnVuY3Rpb24gc2FmZUxvYWRBbGwoaW5wdXQsIG91dHB1dCwgb3B0aW9ucykge1xuICBsb2FkQWxsKGlucHV0LCBvdXRwdXQsIGNvbW1vbi5leHRlbmQoeyBzY2hlbWE6IERFRkFVTFRfU0FGRV9TQ0hFTUEgfSwgb3B0aW9ucykpO1xufVxuXG5cbmZ1bmN0aW9uIHNhZmVMb2FkKGlucHV0LCBvcHRpb25zKSB7XG4gIHJldHVybiBsb2FkKGlucHV0LCBjb21tb24uZXh0ZW5kKHsgc2NoZW1hOiBERUZBVUxUX1NBRkVfU0NIRU1BIH0sIG9wdGlvbnMpKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5sb2FkQWxsICAgICA9IGxvYWRBbGw7XG5tb2R1bGUuZXhwb3J0cy5sb2FkICAgICAgICA9IGxvYWQ7XG5tb2R1bGUuZXhwb3J0cy5zYWZlTG9hZEFsbCA9IHNhZmVMb2FkQWxsO1xubW9kdWxlLmV4cG9ydHMuc2FmZUxvYWQgICAgPSBzYWZlTG9hZDtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgY29tbW9uID0gcmVxdWlyZSgnLi9jb21tb24nKTtcblxuXG5mdW5jdGlvbiBNYXJrKG5hbWUsIGJ1ZmZlciwgcG9zaXRpb24sIGxpbmUsIGNvbHVtbikge1xuICB0aGlzLm5hbWUgICAgID0gbmFtZTtcbiAgdGhpcy5idWZmZXIgICA9IGJ1ZmZlcjtcbiAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICB0aGlzLmxpbmUgICAgID0gbGluZTtcbiAgdGhpcy5jb2x1bW4gICA9IGNvbHVtbjtcbn1cblxuXG5NYXJrLnByb3RvdHlwZS5nZXRTbmlwcGV0ID0gZnVuY3Rpb24gZ2V0U25pcHBldChpbmRlbnQsIG1heExlbmd0aCkge1xuICB2YXIgaGVhZCwgc3RhcnQsIHRhaWwsIGVuZCwgc25pcHBldDtcblxuICBpZiAoIXRoaXMuYnVmZmVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgNDtcbiAgbWF4TGVuZ3RoID0gbWF4TGVuZ3RoIHx8IDc1O1xuXG4gIGhlYWQgPSAnJztcbiAgc3RhcnQgPSB0aGlzLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChzdGFydCA+IDAgJiYgLTEgPT09ICdcXHgwMFxcclxcblxceDg1XFx1MjAyOFxcdTIwMjknLmluZGV4T2YodGhpcy5idWZmZXIuY2hhckF0KHN0YXJ0IC0gMSkpKSB7XG4gICAgc3RhcnQgLT0gMTtcbiAgICBpZiAodGhpcy5wb3NpdGlvbiAtIHN0YXJ0ID4gKG1heExlbmd0aCAvIDIgLSAxKSkge1xuICAgICAgaGVhZCA9ICcgLi4uICc7XG4gICAgICBzdGFydCArPSA1O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdGFpbCA9ICcnO1xuICBlbmQgPSB0aGlzLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChlbmQgPCB0aGlzLmJ1ZmZlci5sZW5ndGggJiYgLTEgPT09ICdcXHgwMFxcclxcblxceDg1XFx1MjAyOFxcdTIwMjknLmluZGV4T2YodGhpcy5idWZmZXIuY2hhckF0KGVuZCkpKSB7XG4gICAgZW5kICs9IDE7XG4gICAgaWYgKGVuZCAtIHRoaXMucG9zaXRpb24gPiAobWF4TGVuZ3RoIC8gMiAtIDEpKSB7XG4gICAgICB0YWlsID0gJyAuLi4gJztcbiAgICAgIGVuZCAtPSA1O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgc25pcHBldCA9IHRoaXMuYnVmZmVyLnNsaWNlKHN0YXJ0LCBlbmQpO1xuXG4gIHJldHVybiBjb21tb24ucmVwZWF0KCcgJywgaW5kZW50KSArIGhlYWQgKyBzbmlwcGV0ICsgdGFpbCArICdcXG4nICtcbiAgICAgICAgIGNvbW1vbi5yZXBlYXQoJyAnLCBpbmRlbnQgKyB0aGlzLnBvc2l0aW9uIC0gc3RhcnQgKyBoZWFkLmxlbmd0aCkgKyAnXic7XG59O1xuXG5cbk1hcmsucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoY29tcGFjdCkge1xuICB2YXIgc25pcHBldCwgd2hlcmUgPSAnJztcblxuICBpZiAodGhpcy5uYW1lKSB7XG4gICAgd2hlcmUgKz0gJ2luIFwiJyArIHRoaXMubmFtZSArICdcIiAnO1xuICB9XG5cbiAgd2hlcmUgKz0gJ2F0IGxpbmUgJyArICh0aGlzLmxpbmUgKyAxKSArICcsIGNvbHVtbiAnICsgKHRoaXMuY29sdW1uICsgMSk7XG5cbiAgaWYgKCFjb21wYWN0KSB7XG4gICAgc25pcHBldCA9IHRoaXMuZ2V0U25pcHBldCgpO1xuXG4gICAgaWYgKHNuaXBwZXQpIHtcbiAgICAgIHdoZXJlICs9ICc6XFxuJyArIHNuaXBwZXQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHdoZXJlO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcms7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIGNvbW1vbiAgICAgICAgPSByZXF1aXJlKCcuL2NvbW1vbicpO1xudmFyIFlBTUxFeGNlcHRpb24gPSByZXF1aXJlKCcuL2V4Y2VwdGlvbicpO1xudmFyIFR5cGUgICAgICAgICAgPSByZXF1aXJlKCcuL3R5cGUnKTtcblxuXG5mdW5jdGlvbiBjb21waWxlTGlzdChzY2hlbWEsIG5hbWUsIHJlc3VsdCkge1xuICB2YXIgZXhjbHVkZSA9IFtdO1xuXG4gIHNjaGVtYS5pbmNsdWRlLmZvckVhY2goZnVuY3Rpb24gKGluY2x1ZGVkU2NoZW1hKSB7XG4gICAgcmVzdWx0ID0gY29tcGlsZUxpc3QoaW5jbHVkZWRTY2hlbWEsIG5hbWUsIHJlc3VsdCk7XG4gIH0pO1xuXG4gIHNjaGVtYVtuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uIChjdXJyZW50VHlwZSkge1xuICAgIHJlc3VsdC5mb3JFYWNoKGZ1bmN0aW9uIChwcmV2aW91c1R5cGUsIHByZXZpb3VzSW5kZXgpIHtcbiAgICAgIGlmIChwcmV2aW91c1R5cGUudGFnID09PSBjdXJyZW50VHlwZS50YWcpIHtcbiAgICAgICAgZXhjbHVkZS5wdXNoKHByZXZpb3VzSW5kZXgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmVzdWx0LnB1c2goY3VycmVudFR5cGUpO1xuICB9KTtcblxuICByZXR1cm4gcmVzdWx0LmZpbHRlcihmdW5jdGlvbiAodHlwZSwgaW5kZXgpIHtcbiAgICByZXR1cm4gLTEgPT09IGV4Y2x1ZGUuaW5kZXhPZihpbmRleCk7XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGNvbXBpbGVNYXAoLyogbGlzdHMuLi4gKi8pIHtcbiAgdmFyIHJlc3VsdCA9IHt9LCBpbmRleCwgbGVuZ3RoO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3RUeXBlKHR5cGUpIHtcbiAgICByZXN1bHRbdHlwZS50YWddID0gdHlwZTtcbiAgfVxuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGFyZ3VtZW50c1tpbmRleF0uZm9yRWFjaChjb2xsZWN0VHlwZSk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIFNjaGVtYShkZWZpbml0aW9uKSB7XG4gIHRoaXMuaW5jbHVkZSAgPSBkZWZpbml0aW9uLmluY2x1ZGUgIHx8IFtdO1xuICB0aGlzLmltcGxpY2l0ID0gZGVmaW5pdGlvbi5pbXBsaWNpdCB8fCBbXTtcbiAgdGhpcy5leHBsaWNpdCA9IGRlZmluaXRpb24uZXhwbGljaXQgfHwgW107XG5cbiAgdGhpcy5pbXBsaWNpdC5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgaWYgKHR5cGUubG9hZEtpbmQgJiYgJ3NjYWxhcicgIT09IHR5cGUubG9hZEtpbmQpIHtcbiAgICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdUaGVyZSBpcyBhIG5vbi1zY2FsYXIgdHlwZSBpbiB0aGUgaW1wbGljaXQgbGlzdCBvZiBhIHNjaGVtYS4gSW1wbGljaXQgcmVzb2x2aW5nIG9mIHN1Y2ggdHlwZXMgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICB9XG4gIH0pO1xuXG4gIHRoaXMuY29tcGlsZWRJbXBsaWNpdCA9IGNvbXBpbGVMaXN0KHRoaXMsICdpbXBsaWNpdCcsIFtdKTtcbiAgdGhpcy5jb21waWxlZEV4cGxpY2l0ID0gY29tcGlsZUxpc3QodGhpcywgJ2V4cGxpY2l0JywgW10pO1xuICB0aGlzLmNvbXBpbGVkVHlwZU1hcCAgPSBjb21waWxlTWFwKHRoaXMuY29tcGlsZWRJbXBsaWNpdCwgdGhpcy5jb21waWxlZEV4cGxpY2l0KTtcbn1cblxuXG5TY2hlbWEuREVGQVVMVCA9IG51bGw7XG5cblxuU2NoZW1hLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZVNjaGVtYSgpIHtcbiAgdmFyIHNjaGVtYXMsIHR5cGVzO1xuXG4gIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICBjYXNlIDE6XG4gICAgc2NoZW1hcyA9IFNjaGVtYS5ERUZBVUxUO1xuICAgIHR5cGVzID0gYXJndW1lbnRzWzBdO1xuICAgIGJyZWFrO1xuXG4gIGNhc2UgMjpcbiAgICBzY2hlbWFzID0gYXJndW1lbnRzWzBdO1xuICAgIHR5cGVzID0gYXJndW1lbnRzWzFdO1xuICAgIGJyZWFrO1xuXG4gIGRlZmF1bHQ6XG4gICAgdGhyb3cgbmV3IFlBTUxFeGNlcHRpb24oJ1dyb25nIG51bWJlciBvZiBhcmd1bWVudHMgZm9yIFNjaGVtYS5jcmVhdGUgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIHNjaGVtYXMgPSBjb21tb24udG9BcnJheShzY2hlbWFzKTtcbiAgdHlwZXMgPSBjb21tb24udG9BcnJheSh0eXBlcyk7XG5cbiAgaWYgKCFzY2hlbWFzLmV2ZXJ5KGZ1bmN0aW9uIChzY2hlbWEpIHsgcmV0dXJuIHNjaGVtYSBpbnN0YW5jZW9mIFNjaGVtYTsgfSkpIHtcbiAgICB0aHJvdyBuZXcgWUFNTEV4Y2VwdGlvbignU3BlY2lmaWVkIGxpc3Qgb2Ygc3VwZXIgc2NoZW1hcyAob3IgYSBzaW5nbGUgU2NoZW1hIG9iamVjdCkgY29udGFpbnMgYSBub24tU2NoZW1hIG9iamVjdC4nKTtcbiAgfVxuXG4gIGlmICghdHlwZXMuZXZlcnkoZnVuY3Rpb24gKHR5cGUpIHsgcmV0dXJuIHR5cGUgaW5zdGFuY2VvZiBUeXBlOyB9KSkge1xuICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdTcGVjaWZpZWQgbGlzdCBvZiBZQU1MIHR5cGVzIChvciBhIHNpbmdsZSBUeXBlIG9iamVjdCkgY29udGFpbnMgYSBub24tVHlwZSBvYmplY3QuJyk7XG4gIH1cblxuICByZXR1cm4gbmV3IFNjaGVtYSh7XG4gICAgaW5jbHVkZTogc2NoZW1hcyxcbiAgICBleHBsaWNpdDogdHlwZXNcbiAgfSk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU2NoZW1hO1xuIiwiLy8gU3RhbmRhcmQgWUFNTCdzIENvcmUgc2NoZW1hLlxuLy8gaHR0cDovL3d3dy55YW1sLm9yZy9zcGVjLzEuMi9zcGVjLmh0bWwjaWQyODA0OTIzXG4vL1xuLy8gTk9URTogSlMtWUFNTCBkb2VzIG5vdCBzdXBwb3J0IHNjaGVtYS1zcGVjaWZpYyB0YWcgcmVzb2x1dGlvbiByZXN0cmljdGlvbnMuXG4vLyBTbywgQ29yZSBzY2hlbWEgaGFzIG5vIGRpc3RpbmN0aW9ucyBmcm9tIEpTT04gc2NoZW1hIGlzIEpTLVlBTUwuXG5cblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBTY2hlbWEgPSByZXF1aXJlKCcuLi9zY2hlbWEnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTY2hlbWEoe1xuICBpbmNsdWRlOiBbXG4gICAgcmVxdWlyZSgnLi9qc29uJylcbiAgXVxufSk7XG4iLCIvLyBKUy1ZQU1MJ3MgZGVmYXVsdCBzY2hlbWEgZm9yIGBsb2FkYCBmdW5jdGlvbi5cbi8vIEl0IGlzIG5vdCBkZXNjcmliZWQgaW4gdGhlIFlBTUwgc3BlY2lmaWNhdGlvbi5cbi8vXG4vLyBUaGlzIHNjaGVtYSBpcyBiYXNlZCBvbiBKUy1ZQU1MJ3MgZGVmYXVsdCBzYWZlIHNjaGVtYSBhbmQgaW5jbHVkZXNcbi8vIEphdmFTY3JpcHQtc3BlY2lmaWMgdHlwZXM6ICEhanMvdW5kZWZpbmVkLCAhIWpzL3JlZ2V4cCBhbmQgISFqcy9mdW5jdGlvbi5cbi8vXG4vLyBBbHNvIHRoaXMgc2NoZW1hIGlzIHVzZWQgYXMgZGVmYXVsdCBiYXNlIHNjaGVtYSBhdCBgU2NoZW1hLmNyZWF0ZWAgZnVuY3Rpb24uXG5cblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBTY2hlbWEgPSByZXF1aXJlKCcuLi9zY2hlbWEnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjaGVtYS5ERUZBVUxUID0gbmV3IFNjaGVtYSh7XG4gIGluY2x1ZGU6IFtcbiAgICByZXF1aXJlKCcuL2RlZmF1bHRfc2FmZScpXG4gIF0sXG4gIGV4cGxpY2l0OiBbXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9qcy91bmRlZmluZWQnKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL2pzL3JlZ2V4cCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvanMvZnVuY3Rpb24nKVxuICBdXG59KTtcbiIsIi8vIEpTLVlBTUwncyBkZWZhdWx0IHNjaGVtYSBmb3IgYHNhZmVMb2FkYCBmdW5jdGlvbi5cbi8vIEl0IGlzIG5vdCBkZXNjcmliZWQgaW4gdGhlIFlBTUwgc3BlY2lmaWNhdGlvbi5cbi8vXG4vLyBUaGlzIHNjaGVtYSBpcyBiYXNlZCBvbiBzdGFuZGFyZCBZQU1MJ3MgQ29yZSBzY2hlbWEgYW5kIGluY2x1ZGVzIG1vc3Qgb2Zcbi8vIGV4dHJhIHR5cGVzIGRlc2NyaWJlZCBhdCBZQU1MIHRhZyByZXBvc2l0b3J5LiAoaHR0cDovL3lhbWwub3JnL3R5cGUvKVxuXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgU2NoZW1hID0gcmVxdWlyZSgnLi4vc2NoZW1hJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgU2NoZW1hKHtcbiAgaW5jbHVkZTogW1xuICAgIHJlcXVpcmUoJy4vY29yZScpXG4gIF0sXG4gIGltcGxpY2l0OiBbXG4gICAgcmVxdWlyZSgnLi4vdHlwZS90aW1lc3RhbXAnKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL21lcmdlJylcbiAgXSxcbiAgZXhwbGljaXQ6IFtcbiAgICByZXF1aXJlKCcuLi90eXBlL2JpbmFyeScpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvb21hcCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvcGFpcnMnKSxcbiAgICByZXF1aXJlKCcuLi90eXBlL3NldCcpXG4gIF1cbn0pO1xuIiwiLy8gU3RhbmRhcmQgWUFNTCdzIEZhaWxzYWZlIHNjaGVtYS5cbi8vIGh0dHA6Ly93d3cueWFtbC5vcmcvc3BlYy8xLjIvc3BlYy5odG1sI2lkMjgwMjM0NlxuXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgU2NoZW1hID0gcmVxdWlyZSgnLi4vc2NoZW1hJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgU2NoZW1hKHtcbiAgZXhwbGljaXQ6IFtcbiAgICByZXF1aXJlKCcuLi90eXBlL3N0cicpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvc2VxJyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9tYXAnKVxuICBdXG59KTtcbiIsIi8vIFN0YW5kYXJkIFlBTUwncyBKU09OIHNjaGVtYS5cbi8vIGh0dHA6Ly93d3cueWFtbC5vcmcvc3BlYy8xLjIvc3BlYy5odG1sI2lkMjgwMzIzMVxuLy9cbi8vIE5PVEU6IEpTLVlBTUwgZG9lcyBub3Qgc3VwcG9ydCBzY2hlbWEtc3BlY2lmaWMgdGFnIHJlc29sdXRpb24gcmVzdHJpY3Rpb25zLlxuLy8gU28sIHRoaXMgc2NoZW1hIGlzIG5vdCBzdWNoIHN0cmljdCBhcyBkZWZpbmVkIGluIHRoZSBZQU1MIHNwZWNpZmljYXRpb24uXG4vLyBJdCBhbGxvd3MgbnVtYmVycyBpbiBiaW5hcnkgbm90YWlvbiwgdXNlIGBOdWxsYCBhbmQgYE5VTExgIGFzIGBudWxsYCwgZXRjLlxuXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgU2NoZW1hID0gcmVxdWlyZSgnLi4vc2NoZW1hJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgU2NoZW1hKHtcbiAgaW5jbHVkZTogW1xuICAgIHJlcXVpcmUoJy4vZmFpbHNhZmUnKVxuICBdLFxuICBpbXBsaWNpdDogW1xuICAgIHJlcXVpcmUoJy4uL3R5cGUvbnVsbCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvYm9vbCcpLFxuICAgIHJlcXVpcmUoJy4uL3R5cGUvaW50JyksXG4gICAgcmVxdWlyZSgnLi4vdHlwZS9mbG9hdCcpXG4gIF1cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBZQU1MRXhjZXB0aW9uID0gcmVxdWlyZSgnLi9leGNlcHRpb24nKTtcblxuXG52YXIgVFlQRV9DT05TVFJVQ1RPUl9PUFRJT05TID0gW1xuICAnbG9hZEtpbmQnLFxuICAnbG9hZFJlc29sdmVyJyxcbiAgJ2R1bXBJbnN0YW5jZU9mJyxcbiAgJ2R1bXBQcmVkaWNhdGUnLFxuICAnZHVtcFJlcHJlc2VudGVyJyxcbiAgJ2R1bXBEZWZhdWx0U3R5bGUnLFxuICAnZHVtcFN0eWxlQWxpYXNlcydcbl07XG5cblxudmFyIFlBTUxfTk9ERV9LSU5EUyA9IFtcbiAgJ3NjYWxhcicsXG4gICdzZXF1ZW5jZScsXG4gICdtYXBwaW5nJ1xuXTtcblxuXG5mdW5jdGlvbiBjb21waWxlU3R5bGVBbGlhc2VzKG1hcCkge1xuICB2YXIgcmVzdWx0ID0ge307XG5cbiAgaWYgKG51bGwgIT09IG1hcCkge1xuICAgIE9iamVjdC5rZXlzKG1hcCkuZm9yRWFjaChmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAgIG1hcFtzdHlsZV0uZm9yRWFjaChmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgcmVzdWx0W1N0cmluZyhhbGlhcyldID0gc3R5bGU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuZnVuY3Rpb24gVHlwZSh0YWcsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIGlmICgtMSA9PT0gVFlQRV9DT05TVFJVQ1RPUl9PUFRJT05TLmluZGV4T2YobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBZQU1MRXhjZXB0aW9uKCdVbmtub3duIG9wdGlvbiBcIicgKyBuYW1lICsgJ1wiIGlzIG1ldCBpbiBkZWZpbml0aW9uIG9mIFwiJyArIHRhZyArICdcIiBZQU1MIHR5cGUuJyk7XG4gICAgfVxuICB9KTtcblxuICAvLyBUT0RPOiBBZGQgdGFnIGZvcm1hdCBjaGVjay5cbiAgdGhpcy50YWcgICAgICAgICAgICAgID0gdGFnO1xuICB0aGlzLmxvYWRLaW5kICAgICAgICAgPSBvcHRpb25zWydsb2FkS2luZCddICAgICAgICAgfHwgbnVsbDtcbiAgdGhpcy5sb2FkUmVzb2x2ZXIgICAgID0gb3B0aW9uc1snbG9hZFJlc29sdmVyJ10gICAgIHx8IG51bGw7XG4gIHRoaXMuZHVtcEluc3RhbmNlT2YgICA9IG9wdGlvbnNbJ2R1bXBJbnN0YW5jZU9mJ10gICB8fCBudWxsO1xuICB0aGlzLmR1bXBQcmVkaWNhdGUgICAgPSBvcHRpb25zWydkdW1wUHJlZGljYXRlJ10gICAgfHwgbnVsbDtcbiAgdGhpcy5kdW1wUmVwcmVzZW50ZXIgID0gb3B0aW9uc1snZHVtcFJlcHJlc2VudGVyJ10gIHx8IG51bGw7XG4gIHRoaXMuZHVtcERlZmF1bHRTdHlsZSA9IG9wdGlvbnNbJ2R1bXBEZWZhdWx0U3R5bGUnXSB8fCBudWxsO1xuICB0aGlzLmR1bXBTdHlsZUFsaWFzZXMgPSBjb21waWxlU3R5bGVBbGlhc2VzKG9wdGlvbnNbJ2R1bXBTdHlsZUFsaWFzZXMnXSB8fCBudWxsKTtcblxuICBpZiAoLTEgPT09IFlBTUxfTk9ERV9LSU5EUy5pbmRleE9mKHRoaXMubG9hZEtpbmQpKSB7XG4gICAgdGhyb3cgbmV3IFlBTUxFeGNlcHRpb24oJ1Vua25vd24gbG9hZEtpbmQgXCInICsgdGhpcy5sb2FkS2luZCArICdcIiBpcyBzcGVjaWZpZWQgZm9yIFwiJyArIHRhZyArICdcIiBZQU1MIHR5cGUuJyk7XG4gIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFR5cGU7XG4iLCIvLyBNb2RpZmllZCBmcm9tOlxuLy8gaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS9rYW5ha2Evbm9WTkMvZDg5MGU4NjQwZjIwZmJhMzIxNWJhN2JlOGUwZmYxNDVhZWI4YzE3Yy9pbmNsdWRlL2Jhc2U2NC5qc1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIEEgdHJpY2sgZm9yIGJyb3dzZXJpZmllZCB2ZXJzaW9uLlxuLy8gU2luY2Ugd2UgbWFrZSBicm93c2VyaWZpZXIgdG8gaWdub3JlIGBidWZmZXJgIG1vZHVsZSwgTm9kZUJ1ZmZlciB3aWxsIGJlIHVuZGVmaW5lZFxudmFyIE5vZGVCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5CdWZmZXI7XG5cbnZhciBUeXBlICAgICAgID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG5cblxudmFyIEJBU0U2NF9QQURESU5HID0gJz0nO1xuXG52YXIgQkFTRTY0X0JJTlRBQkxFID0gW1xuICAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSxcbiAgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsXG4gIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgNjIsIC0xLCAtMSwgLTEsIDYzLFxuICA1MiwgNTMsIDU0LCA1NSwgNTYsIDU3LCA1OCwgNTksIDYwLCA2MSwgLTEsIC0xLCAtMSwgIDAsIC0xLCAtMSxcbiAgLTEsICAwLCAgMSwgIDIsICAzLCAgNCwgIDUsICA2LCAgNywgIDgsICA5LCAxMCwgMTEsIDEyLCAxMywgMTQsXG4gIDE1LCAxNiwgMTcsIDE4LCAxOSwgMjAsIDIxLCAyMiwgMjMsIDI0LCAyNSwgLTEsIC0xLCAtMSwgLTEsIC0xLFxuICAtMSwgMjYsIDI3LCAyOCwgMjksIDMwLCAzMSwgMzIsIDMzLCAzNCwgMzUsIDM2LCAzNywgMzgsIDM5LCA0MCxcbiAgNDEsIDQyLCA0MywgNDQsIDQ1LCA0NiwgNDcsIDQ4LCA0OSwgNTAsIDUxLCAtMSwgLTEsIC0xLCAtMSwgLTFcbl07XG5cbnZhciBCQVNFNjRfQ0hBUlRBQkxFID1cbiAgJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nLnNwbGl0KCcnKTtcblxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbEJpbmFyeShzdGF0ZSkge1xuICB2YXIgdmFsdWUsIGNvZGUsIGlkeCA9IDAsIHJlc3VsdCA9IFtdLCBsZWZ0Yml0cywgbGVmdGRhdGEsXG4gICAgICBvYmplY3QgPSBzdGF0ZS5yZXN1bHQ7XG5cbiAgbGVmdGJpdHMgPSAwOyAvLyBudW1iZXIgb2YgYml0cyBkZWNvZGVkLCBidXQgeWV0IHRvIGJlIGFwcGVuZGVkXG4gIGxlZnRkYXRhID0gMDsgLy8gYml0cyBkZWNvZGVkLCBidXQgeWV0IHRvIGJlIGFwcGVuZGVkXG5cbiAgLy8gQ29udmVydCBvbmUgYnkgb25lLlxuICBmb3IgKGlkeCA9IDA7IGlkeCA8IG9iamVjdC5sZW5ndGg7IGlkeCArPSAxKSB7XG4gICAgY29kZSA9IG9iamVjdC5jaGFyQ29kZUF0KGlkeCk7XG4gICAgdmFsdWUgPSBCQVNFNjRfQklOVEFCTEVbY29kZSAmIDB4N0ZdO1xuXG4gICAgLy8gU2tpcCBMRihOTCkgfHwgQ1JcbiAgICBpZiAoMHgwQSAhPT0gY29kZSAmJiAweDBEICE9PSBjb2RlKSB7XG4gICAgICAvLyBGYWlsIG9uIGlsbGVnYWwgY2hhcmFjdGVyc1xuICAgICAgaWYgKC0xID09PSB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbGxlY3QgZGF0YSBpbnRvIGxlZnRkYXRhLCB1cGRhdGUgYml0Y291bnRcbiAgICAgIGxlZnRkYXRhID0gKGxlZnRkYXRhIDw8IDYpIHwgdmFsdWU7XG4gICAgICBsZWZ0Yml0cyArPSA2O1xuXG4gICAgICAvLyBJZiB3ZSBoYXZlIDggb3IgbW9yZSBiaXRzLCBhcHBlbmQgOCBiaXRzIHRvIHRoZSByZXN1bHRcbiAgICAgIGlmIChsZWZ0Yml0cyA+PSA4KSB7XG4gICAgICAgIGxlZnRiaXRzIC09IDg7XG5cbiAgICAgICAgLy8gQXBwZW5kIGlmIG5vdCBwYWRkaW5nLlxuICAgICAgICBpZiAoQkFTRTY0X1BBRERJTkcgIT09IG9iamVjdC5jaGFyQXQoaWR4KSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKChsZWZ0ZGF0YSA+PiBsZWZ0Yml0cykgJiAweEZGKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxlZnRkYXRhICY9ICgxIDw8IGxlZnRiaXRzKSAtIDE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgdGhlcmUgYXJlIGFueSBiaXRzIGxlZnQsIHRoZSBiYXNlNjQgc3RyaW5nIHdhcyBjb3JydXB0ZWRcbiAgaWYgKGxlZnRiaXRzKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIC8vIFdyYXAgaW50byBCdWZmZXIgZm9yIE5vZGVKUyBhbmQgbGVhdmUgQXJyYXkgZm9yIGJyb3dzZXJcbiAgICBpZiAoTm9kZUJ1ZmZlcikge1xuICAgICAgc3RhdGUucmVzdWx0ID0gbmV3IE5vZGVCdWZmZXIocmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUucmVzdWx0ID0gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHJlcHJlc2VudFlhbWxCaW5hcnkob2JqZWN0IC8qLCBzdHlsZSovKSB7XG4gIHZhciByZXN1bHQgPSAnJywgaW5kZXgsIGxlbmd0aCwgcmVzdDtcblxuICAvLyBDb252ZXJ0IGV2ZXJ5IHRocmVlIGJ5dGVzIHRvIDQgQVNDSUkgY2hhcmFjdGVycy5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGggLSAyOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMykge1xuICAgIHJlc3VsdCArPSBCQVNFNjRfQ0hBUlRBQkxFW29iamVjdFtpbmRleCArIDBdID4+IDJdO1xuICAgIHJlc3VsdCArPSBCQVNFNjRfQ0hBUlRBQkxFWygob2JqZWN0W2luZGV4ICsgMF0gJiAweDAzKSA8PCA0KSArIChvYmplY3RbaW5kZXggKyAxXSA+PiA0KV07XG4gICAgcmVzdWx0ICs9IEJBU0U2NF9DSEFSVEFCTEVbKChvYmplY3RbaW5kZXggKyAxXSAmIDB4MEYpIDw8IDIpICsgKG9iamVjdFtpbmRleCArIDJdID4+IDYpXTtcbiAgICByZXN1bHQgKz0gQkFTRTY0X0NIQVJUQUJMRVtvYmplY3RbaW5kZXggKyAyXSAmIDB4M0ZdO1xuICB9XG5cbiAgcmVzdCA9IG9iamVjdC5sZW5ndGggJSAzO1xuXG4gIC8vIENvbnZlcnQgdGhlIHJlbWFpbmluZyAxIG9yIDIgYnl0ZXMsIHBhZGRpbmcgb3V0IHRvIDQgY2hhcmFjdGVycy5cbiAgaWYgKDAgIT09IHJlc3QpIHtcbiAgICBpbmRleCA9IG9iamVjdC5sZW5ndGggLSByZXN0O1xuICAgIHJlc3VsdCArPSBCQVNFNjRfQ0hBUlRBQkxFW29iamVjdFtpbmRleCArIDBdID4+IDJdO1xuXG4gICAgaWYgKDIgPT09IHJlc3QpIHtcbiAgICAgIHJlc3VsdCArPSBCQVNFNjRfQ0hBUlRBQkxFWygob2JqZWN0W2luZGV4ICsgMF0gJiAweDAzKSA8PCA0KSArIChvYmplY3RbaW5kZXggKyAxXSA+PiA0KV07XG4gICAgICByZXN1bHQgKz0gQkFTRTY0X0NIQVJUQUJMRVsob2JqZWN0W2luZGV4ICsgMV0gJiAweDBGKSA8PCAyXTtcbiAgICAgIHJlc3VsdCArPSBCQVNFNjRfUEFERElORztcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ICs9IEJBU0U2NF9DSEFSVEFCTEVbKG9iamVjdFtpbmRleCArIDBdICYgMHgwMykgPDwgNF07XG4gICAgICByZXN1bHQgKz0gQkFTRTY0X1BBRERJTkcgKyBCQVNFNjRfUEFERElORztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIGlzQmluYXJ5KG9iamVjdCkge1xuICByZXR1cm4gTm9kZUJ1ZmZlciAmJiBOb2RlQnVmZmVyLmlzQnVmZmVyKG9iamVjdCk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6YmluYXJ5Jywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxCaW5hcnksXG4gIGR1bXBQcmVkaWNhdGU6IGlzQmluYXJ5LFxuICBkdW1wUmVwcmVzZW50ZXI6IHJlcHJlc2VudFlhbWxCaW5hcnlcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG5cbnZhciBZQU1MX0lNUExJQ0lUX0JPT0xFQU5fTUFQID0ge1xuICAndHJ1ZScgIDogdHJ1ZSxcbiAgJ1RydWUnICA6IHRydWUsXG4gICdUUlVFJyAgOiB0cnVlLFxuICAnZmFsc2UnIDogZmFsc2UsXG4gICdGYWxzZScgOiBmYWxzZSxcbiAgJ0ZBTFNFJyA6IGZhbHNlXG59O1xuXG4vKnZhciBZQU1MX0VYUExJQ0lUX0JPT0xFQU5fTUFQID0ge1xuICAndHJ1ZScgIDogdHJ1ZSxcbiAgJ1RydWUnICA6IHRydWUsXG4gICdUUlVFJyAgOiB0cnVlLFxuICAnZmFsc2UnIDogZmFsc2UsXG4gICdGYWxzZScgOiBmYWxzZSxcbiAgJ0ZBTFNFJyA6IGZhbHNlLFxuICAneScgICAgIDogdHJ1ZSxcbiAgJ1knICAgICA6IHRydWUsXG4gICd5ZXMnICAgOiB0cnVlLFxuICAnWWVzJyAgIDogdHJ1ZSxcbiAgJ1lFUycgICA6IHRydWUsXG4gICduJyAgICAgOiBmYWxzZSxcbiAgJ04nICAgICA6IGZhbHNlLFxuICAnbm8nICAgIDogZmFsc2UsXG4gICdObycgICAgOiBmYWxzZSxcbiAgJ05PJyAgICA6IGZhbHNlLFxuICAnb24nICAgIDogdHJ1ZSxcbiAgJ09uJyAgICA6IHRydWUsXG4gICdPTicgICAgOiB0cnVlLFxuICAnb2ZmJyAgIDogZmFsc2UsXG4gICdPZmYnICAgOiBmYWxzZSxcbiAgJ09GRicgICA6IGZhbHNlXG59OyovXG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxCb29sZWFuKHN0YXRlKSB7XG4gIGlmIChZQU1MX0lNUExJQ0lUX0JPT0xFQU5fTUFQLmhhc093blByb3BlcnR5KHN0YXRlLnJlc3VsdCkpIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSBZQU1MX0lNUExJQ0lUX0JPT0xFQU5fTUFQW3N0YXRlLnJlc3VsdF07XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cblxuZnVuY3Rpb24gaXNCb29sZWFuKG9iamVjdCkge1xuICByZXR1cm4gJ1tvYmplY3QgQm9vbGVhbl0nID09PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpib29sJywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxCb29sZWFuLFxuICBkdW1wUHJlZGljYXRlOiBpc0Jvb2xlYW4sXG4gIGR1bXBSZXByZXNlbnRlcjoge1xuICAgIGxvd2VyY2FzZTogZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4gb2JqZWN0ID8gJ3RydWUnIDogJ2ZhbHNlJzsgfSxcbiAgICB1cHBlcmNhc2U6IGZ1bmN0aW9uIChvYmplY3QpIHsgcmV0dXJuIG9iamVjdCA/ICdUUlVFJyA6ICdGQUxTRSc7IH0sXG4gICAgY2FtZWxjYXNlOiBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiBvYmplY3QgPyAnVHJ1ZScgOiAnRmFsc2UnOyB9XG4gIH0sXG4gIGR1bXBEZWZhdWx0U3R5bGU6ICdsb3dlcmNhc2UnXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG52YXIgWUFNTF9GTE9BVF9QQVRURVJOID0gbmV3IFJlZ0V4cChcbiAgJ14oPzpbLStdPyg/OlswLTldWzAtOV9dKilcXFxcLlswLTlfXSooPzpbZUVdWy0rXVswLTldKyk/JyArXG4gICd8XFxcXC5bMC05X10rKD86W2VFXVstK11bMC05XSspPycgK1xuICAnfFstK10/WzAtOV1bMC05X10qKD86OlswLTVdP1swLTldKStcXFxcLlswLTlfXSonICtcbiAgJ3xbLStdP1xcXFwuKD86aW5mfEluZnxJTkYpJyArXG4gICd8XFxcXC4oPzpuYW58TmFOfE5BTikpJCcpO1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sRmxvYXQoc3RhdGUpIHtcbiAgdmFyIHZhbHVlLCBzaWduLCBiYXNlLCBkaWdpdHMsXG4gICAgICBvYmplY3QgPSBzdGF0ZS5yZXN1bHQ7XG5cbiAgaWYgKCFZQU1MX0ZMT0FUX1BBVFRFUk4udGVzdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFsdWUgID0gb2JqZWN0LnJlcGxhY2UoL18vZywgJycpLnRvTG93ZXJDYXNlKCk7XG4gIHNpZ24gICA9ICctJyA9PT0gdmFsdWVbMF0gPyAtMSA6IDE7XG4gIGRpZ2l0cyA9IFtdO1xuXG4gIGlmICgwIDw9ICcrLScuaW5kZXhPZih2YWx1ZVswXSkpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDEpO1xuICB9XG5cbiAgaWYgKCcuaW5mJyA9PT0gdmFsdWUpIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSAoMSA9PT0gc2lnbikgPyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgOiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICgnLm5hbicgPT09IHZhbHVlKSB7XG4gICAgc3RhdGUucmVzdWx0ID0gTmFOO1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoMCA8PSB2YWx1ZS5pbmRleE9mKCc6JykpIHtcbiAgICB2YWx1ZS5zcGxpdCgnOicpLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgIGRpZ2l0cy51bnNoaWZ0KHBhcnNlRmxvYXQodiwgMTApKTtcbiAgICB9KTtcblxuICAgIHZhbHVlID0gMC4wO1xuICAgIGJhc2UgPSAxO1xuXG4gICAgZGlnaXRzLmZvckVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgIHZhbHVlICs9IGQgKiBiYXNlO1xuICAgICAgYmFzZSAqPSA2MDtcbiAgICB9KTtcblxuICAgIHN0YXRlLnJlc3VsdCA9IHNpZ24gKiB2YWx1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2Uge1xuICAgIHN0YXRlLnJlc3VsdCA9IHNpZ24gKiBwYXJzZUZsb2F0KHZhbHVlLCAxMCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiByZXByZXNlbnRZYW1sRmxvYXQob2JqZWN0LCBzdHlsZSkge1xuICBpZiAoaXNOYU4ob2JqZWN0KSkge1xuICAgIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlICdsb3dlcmNhc2UnOlxuICAgICAgcmV0dXJuICcubmFuJztcbiAgICBjYXNlICd1cHBlcmNhc2UnOlxuICAgICAgcmV0dXJuICcuTkFOJztcbiAgICBjYXNlICdjYW1lbGNhc2UnOlxuICAgICAgcmV0dXJuICcuTmFOJztcbiAgICB9XG4gIH0gZWxzZSBpZiAoTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZID09PSBvYmplY3QpIHtcbiAgICBzd2l0Y2ggKHN0eWxlKSB7XG4gICAgY2FzZSAnbG93ZXJjYXNlJzpcbiAgICAgIHJldHVybiAnLmluZic7XG4gICAgY2FzZSAndXBwZXJjYXNlJzpcbiAgICAgIHJldHVybiAnLklORic7XG4gICAgY2FzZSAnY2FtZWxjYXNlJzpcbiAgICAgIHJldHVybiAnLkluZic7XG4gICAgfVxuICB9IGVsc2UgaWYgKE51bWJlci5ORUdBVElWRV9JTkZJTklUWSA9PT0gb2JqZWN0KSB7XG4gICAgc3dpdGNoIChzdHlsZSkge1xuICAgIGNhc2UgJ2xvd2VyY2FzZSc6XG4gICAgICByZXR1cm4gJy0uaW5mJztcbiAgICBjYXNlICd1cHBlcmNhc2UnOlxuICAgICAgcmV0dXJuICctLklORic7XG4gICAgY2FzZSAnY2FtZWxjYXNlJzpcbiAgICAgIHJldHVybiAnLS5JbmYnO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqZWN0LnRvU3RyaW5nKDEwKTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGlzRmxvYXQob2JqZWN0KSB7XG4gIHJldHVybiAoJ1tvYmplY3QgTnVtYmVyXScgPT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpKSAmJlxuICAgICAgICAgKDAgIT09IG9iamVjdCAlIDEpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOmZsb2F0Jywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxGbG9hdCxcbiAgZHVtcFByZWRpY2F0ZTogaXNGbG9hdCxcbiAgZHVtcFJlcHJlc2VudGVyOiByZXByZXNlbnRZYW1sRmxvYXQsXG4gIGR1bXBEZWZhdWx0U3R5bGU6ICdsb3dlcmNhc2UnXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG52YXIgWUFNTF9JTlRFR0VSX1BBVFRFUk4gPSBuZXcgUmVnRXhwKFxuICAnXig/OlstK10/MGJbMC0xX10rJyArXG4gICd8Wy0rXT8wWzAtN19dKycgK1xuICAnfFstK10/KD86MHxbMS05XVswLTlfXSopJyArXG4gICd8Wy0rXT8weFswLTlhLWZBLUZfXSsnICtcbiAgJ3xbLStdP1sxLTldWzAtOV9dKig/OjpbMC01XT9bMC05XSkrKSQnKTtcblxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbEludGVnZXIoc3RhdGUpIHtcbiAgdmFyIHZhbHVlLCBzaWduLCBiYXNlLCBkaWdpdHMsXG4gICAgICBvYmplY3QgPSBzdGF0ZS5yZXN1bHQ7XG5cbiAgaWYgKCFZQU1MX0lOVEVHRVJfUEFUVEVSTi50ZXN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YWx1ZSAgPSBvYmplY3QucmVwbGFjZSgvXy9nLCAnJyk7XG4gIHNpZ24gICA9ICctJyA9PT0gdmFsdWVbMF0gPyAtMSA6IDE7XG4gIGRpZ2l0cyA9IFtdO1xuXG4gIGlmICgwIDw9ICcrLScuaW5kZXhPZih2YWx1ZVswXSkpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDEpO1xuICB9XG5cbiAgaWYgKCcwJyA9PT0gdmFsdWUpIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSAwO1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoL14wYi8udGVzdCh2YWx1ZSkpIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSBzaWduICogcGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIDIpO1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoL14weC8udGVzdCh2YWx1ZSkpIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSBzaWduICogcGFyc2VJbnQodmFsdWUsIDE2KTtcbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKCcwJyA9PT0gdmFsdWVbMF0pIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSBzaWduICogcGFyc2VJbnQodmFsdWUsIDgpO1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoMCA8PSB2YWx1ZS5pbmRleE9mKCc6JykpIHtcbiAgICB2YWx1ZS5zcGxpdCgnOicpLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgIGRpZ2l0cy51bnNoaWZ0KHBhcnNlSW50KHYsIDEwKSk7XG4gICAgfSk7XG5cbiAgICB2YWx1ZSA9IDA7XG4gICAgYmFzZSA9IDE7XG5cbiAgICBkaWdpdHMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgdmFsdWUgKz0gKGQgKiBiYXNlKTtcbiAgICAgIGJhc2UgKj0gNjA7XG4gICAgfSk7XG5cbiAgICBzdGF0ZS5yZXN1bHQgPSBzaWduICogdmFsdWU7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5yZXN1bHQgPSBzaWduICogcGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGlzSW50ZWdlcihvYmplY3QpIHtcbiAgcmV0dXJuICgnW29iamVjdCBOdW1iZXJdJyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkpICYmXG4gICAgICAgICAoMCA9PT0gb2JqZWN0ICUgMSk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6aW50Jywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxJbnRlZ2VyLFxuICBkdW1wUHJlZGljYXRlOiBpc0ludGVnZXIsXG4gIGR1bXBSZXByZXNlbnRlcjoge1xuICAgIGJpbmFyeTogICAgICBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiAnMGInICsgb2JqZWN0LnRvU3RyaW5nKDIpOyB9LFxuICAgIG9jdGFsOiAgICAgICBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiAnMCcgICsgb2JqZWN0LnRvU3RyaW5nKDgpOyB9LFxuICAgIGRlY2ltYWw6ICAgICBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiAgICAgICAgb2JqZWN0LnRvU3RyaW5nKDEwKTsgfSxcbiAgICBoZXhhZGVjaW1hbDogZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4gJzB4JyArIG9iamVjdC50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTsgfVxuICB9LFxuICBkdW1wRGVmYXVsdFN0eWxlOiAnZGVjaW1hbCcsXG4gIGR1bXBTdHlsZUFsaWFzZXM6IHtcbiAgICBiaW5hcnk6ICAgICAgWyAyLCAgJ2JpbicgXSxcbiAgICBvY3RhbDogICAgICAgWyA4LCAgJ29jdCcgXSxcbiAgICBkZWNpbWFsOiAgICAgWyAxMCwgJ2RlYycgXSxcbiAgICBoZXhhZGVjaW1hbDogWyAxNiwgJ2hleCcgXVxuICB9XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgZXNwcmltYTtcblxuLy8gQnJvd3NlcmlmaWVkIHZlcnNpb24gZG9lcyBub3QgaGF2ZSBlc3ByaW1hXG4vL1xuLy8gMS4gRm9yIG5vZGUuanMganVzdCByZXF1aXJlIG1vZHVsZSBhcyBkZXBzXG4vLyAyLiBGb3IgYnJvd3NlciB0cnkgdG8gcmVxdWlyZSBtdWR1bGUgdmlhIGV4dGVybmFsIEFNRCBzeXN0ZW0uXG4vLyAgICBJZiBub3QgZm91bmQgLSB0cnkgdG8gZmFsbGJhY2sgdG8gd2luZG93LmVzcHJpbWEuIElmIG5vdFxuLy8gICAgZm91bmQgdG9vIC0gdGhlbiBmYWlsIHRvIHBhcnNlLlxuLy9cbnRyeSB7XG4gIGVzcHJpbWEgPSByZXF1aXJlKCdlc3ByaW1hJyk7XG59IGNhdGNoIChfKSB7XG4gIC8qZ2xvYmFsIHdpbmRvdyAqL1xuICBpZiAod2luZG93KSB7IGVzcHJpbWEgPSB3aW5kb3cuZXNwcmltYTsgfVxufVxuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vLi4vdHlwZScpO1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVKYXZhc2NyaXB0RnVuY3Rpb24oc3RhdGUpIHtcbiAgLypqc2xpbnQgZXZpbDp0cnVlKi9cblxuICB0cnkge1xuICAgIHZhciBzb3VyY2UgPSAnKCcgKyBzdGF0ZS5yZXN1bHQgKyAnKScsXG4gICAgICAgIGFzdCAgICA9IGVzcHJpbWEucGFyc2Uoc291cmNlLCB7IHJhbmdlOiB0cnVlIH0pLFxuICAgICAgICBwYXJhbXMgPSBbXSxcbiAgICAgICAgYm9keTtcblxuICAgIGlmICgnUHJvZ3JhbScgICAgICAgICAgICAgIT09IGFzdC50eXBlICAgICAgICAgfHxcbiAgICAgICAgMSAgICAgICAgICAgICAgICAgICAgICE9PSBhc3QuYm9keS5sZW5ndGggIHx8XG4gICAgICAgICdFeHByZXNzaW9uU3RhdGVtZW50JyAhPT0gYXN0LmJvZHlbMF0udHlwZSB8fFxuICAgICAgICAnRnVuY3Rpb25FeHByZXNzaW9uJyAgIT09IGFzdC5ib2R5WzBdLmV4cHJlc3Npb24udHlwZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGFzdC5ib2R5WzBdLmV4cHJlc3Npb24ucGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICBwYXJhbXMucHVzaChwYXJhbS5uYW1lKTtcbiAgICB9KTtcblxuICAgIGJvZHkgPSBhc3QuYm9keVswXS5leHByZXNzaW9uLmJvZHkucmFuZ2U7XG5cbiAgICAvLyBFc3ByaW1hJ3MgcmFuZ2VzIGluY2x1ZGUgdGhlIGZpcnN0ICd7JyBhbmQgdGhlIGxhc3QgJ30nIGNoYXJhY3RlcnMgb25cbiAgICAvLyBmdW5jdGlvbiBleHByZXNzaW9ucy4gU28gY3V0IHRoZW0gb3V0LlxuICAgIHN0YXRlLnJlc3VsdCA9IG5ldyBGdW5jdGlvbihwYXJhbXMsIHNvdXJjZS5zbGljZShib2R5WzBdKzEsIGJvZHlbMV0tMSkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiByZXByZXNlbnRKYXZhc2NyaXB0RnVuY3Rpb24ob2JqZWN0IC8qLCBzdHlsZSovKSB7XG4gIHJldHVybiBvYmplY3QudG9TdHJpbmcoKTtcbn1cblxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKG9iamVjdCkge1xuICByZXR1cm4gJ1tvYmplY3QgRnVuY3Rpb25dJyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6anMvZnVuY3Rpb24nLCB7XG4gIGxvYWRLaW5kOiAnc2NhbGFyJyxcbiAgbG9hZFJlc29sdmVyOiByZXNvbHZlSmF2YXNjcmlwdEZ1bmN0aW9uLFxuICBkdW1wUHJlZGljYXRlOiBpc0Z1bmN0aW9uLFxuICBkdW1wUmVwcmVzZW50ZXI6IHJlcHJlc2VudEphdmFzY3JpcHRGdW5jdGlvblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi8uLi90eXBlJyk7XG5cblxuZnVuY3Rpb24gcmVzb2x2ZUphdmFzY3JpcHRSZWdFeHAoc3RhdGUpIHtcbiAgdmFyIHJlZ2V4cCA9IHN0YXRlLnJlc3VsdCxcbiAgICAgIHRhaWwgICA9IC9cXC8oW2dpbV0qKSQvLmV4ZWMoc3RhdGUucmVzdWx0KSxcbiAgICAgIG1vZGlmaWVycztcblxuICAvLyBgL2Zvby9naW1gIC0gdGFpbCBjYW4gYmUgbWF4aW11bSA0IGNoYXJzXG4gIGlmICgnLycgPT09IHJlZ2V4cFswXSAmJiB0YWlsICYmIDQgPj0gdGFpbFswXS5sZW5ndGgpIHtcbiAgICByZWdleHAgPSByZWdleHAuc2xpY2UoMSwgcmVnZXhwLmxlbmd0aCAtIHRhaWxbMF0ubGVuZ3RoKTtcbiAgICBtb2RpZmllcnMgPSB0YWlsWzFdO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBzdGF0ZS5yZXN1bHQgPSAgbmV3IFJlZ0V4cChyZWdleHAsIG1vZGlmaWVycyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cblxuZnVuY3Rpb24gcmVwcmVzZW50SmF2YXNjcmlwdFJlZ0V4cChvYmplY3QgLyosIHN0eWxlKi8pIHtcbiAgdmFyIHJlc3VsdCA9ICcvJyArIG9iamVjdC5zb3VyY2UgKyAnLyc7XG5cbiAgaWYgKG9iamVjdC5nbG9iYWwpIHtcbiAgICByZXN1bHQgKz0gJ2cnO1xuICB9XG5cbiAgaWYgKG9iamVjdC5tdWx0aWxpbmUpIHtcbiAgICByZXN1bHQgKz0gJ20nO1xuICB9XG5cbiAgaWYgKG9iamVjdC5pZ25vcmVDYXNlKSB7XG4gICAgcmVzdWx0ICs9ICdpJztcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuZnVuY3Rpb24gaXNSZWdFeHAob2JqZWN0KSB7XG4gIHJldHVybiAnW29iamVjdCBSZWdFeHBdJyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6anMvcmVnZXhwJywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZUphdmFzY3JpcHRSZWdFeHAsXG4gIGR1bXBQcmVkaWNhdGU6IGlzUmVnRXhwLFxuICBkdW1wUmVwcmVzZW50ZXI6IHJlcHJlc2VudEphdmFzY3JpcHRSZWdFeHBcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vLi4vdHlwZScpO1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVKYXZhc2NyaXB0VW5kZWZpbmVkKHN0YXRlKSB7XG4gIHN0YXRlLnJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgcmV0dXJuIHRydWU7XG59XG5cblxuZnVuY3Rpb24gcmVwcmVzZW50SmF2YXNjcmlwdFVuZGVmaW5lZCgvKm9iamVjdCwgZXhwbGljaXQqLykge1xuICByZXR1cm4gJyc7XG59XG5cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQob2JqZWN0KSB7XG4gIHJldHVybiAndW5kZWZpbmVkJyA9PT0gdHlwZW9mIG9iamVjdDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpqcy91bmRlZmluZWQnLCB7XG4gIGxvYWRLaW5kOiAnc2NhbGFyJyxcbiAgbG9hZFJlc29sdmVyOiByZXNvbHZlSmF2YXNjcmlwdFVuZGVmaW5lZCxcbiAgZHVtcFByZWRpY2F0ZTogaXNVbmRlZmluZWQsXG4gIGR1bXBSZXByZXNlbnRlcjogcmVwcmVzZW50SmF2YXNjcmlwdFVuZGVmaW5lZFxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6bWFwJywge1xuICBsb2FkS2luZDogJ21hcHBpbmcnXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbE1lcmdlKHN0YXRlKSB7XG4gIHJldHVybiAnPDwnID09PSBzdGF0ZS5yZXN1bHQ7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6bWVyZ2UnLCB7XG4gIGxvYWRLaW5kOiAnc2NhbGFyJyxcbiAgbG9hZFJlc29sdmVyOiByZXNvbHZlWWFtbE1lcmdlXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG52YXIgWUFNTF9OVUxMX01BUCA9IHtcbiAgJ34nICAgIDogdHJ1ZSxcbiAgJ251bGwnIDogdHJ1ZSxcbiAgJ051bGwnIDogdHJ1ZSxcbiAgJ05VTEwnIDogdHJ1ZVxufTtcblxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbE51bGwoc3RhdGUpIHtcbiAgaWYgKFlBTUxfTlVMTF9NQVAuaGFzT3duUHJvcGVydHkoc3RhdGUucmVzdWx0KSkge1xuICAgIHN0YXRlLnJlc3VsdCA9IG51bGw7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5cbmZ1bmN0aW9uIGlzTnVsbChvYmplY3QpIHtcbiAgcmV0dXJuIG51bGwgPT09IG9iamVjdDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpudWxsJywge1xuICBsb2FkS2luZDogJ3NjYWxhcicsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxOdWxsLFxuICBkdW1wUHJlZGljYXRlOiBpc051bGwsXG4gIGR1bXBSZXByZXNlbnRlcjoge1xuICAgIGNhbm9uaWNhbDogZnVuY3Rpb24gKCkgeyByZXR1cm4gJ34nOyAgICB9LFxuICAgIGxvd2VyY2FzZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJ251bGwnOyB9LFxuICAgIHVwcGVyY2FzZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJ05VTEwnOyB9LFxuICAgIGNhbWVsY2FzZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJ051bGwnOyB9XG4gIH0sXG4gIGR1bXBEZWZhdWx0U3R5bGU6ICdsb3dlcmNhc2UnXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG52YXIgX2hhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBfdG9TdHJpbmcgICAgICAgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sT21hcChzdGF0ZSkge1xuICB2YXIgb2JqZWN0S2V5cyA9IFtdLCBpbmRleCwgbGVuZ3RoLCBwYWlyLCBwYWlyS2V5LCBwYWlySGFzS2V5LFxuICAgICAgb2JqZWN0ID0gc3RhdGUucmVzdWx0O1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHBhaXIgPSBvYmplY3RbaW5kZXhdO1xuICAgIHBhaXJIYXNLZXkgPSBmYWxzZTtcblxuICAgIGlmICgnW29iamVjdCBPYmplY3RdJyAhPT0gX3RvU3RyaW5nLmNhbGwocGFpcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmb3IgKHBhaXJLZXkgaW4gcGFpcikge1xuICAgICAgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhaXIsIHBhaXJLZXkpKSB7XG4gICAgICAgIGlmICghcGFpckhhc0tleSkge1xuICAgICAgICAgIHBhaXJIYXNLZXkgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcGFpckhhc0tleSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICgtMSA9PT0gb2JqZWN0S2V5cy5pbmRleE9mKHBhaXJLZXkpKSB7XG4gICAgICBvYmplY3RLZXlzLnB1c2gocGFpcktleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpvbWFwJywge1xuICBsb2FkS2luZDogJ3NlcXVlbmNlJyxcbiAgbG9hZFJlc29sdmVyOiByZXNvbHZlWWFtbE9tYXBcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUeXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG5cbnZhciBfdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sUGFpcnMoc3RhdGUpIHtcbiAgdmFyIGluZGV4LCBsZW5ndGgsIHBhaXIsIGtleXMsIHJlc3VsdCxcbiAgICAgIG9iamVjdCA9IHN0YXRlLnJlc3VsdDtcblxuICByZXN1bHQgPSBuZXcgQXJyYXkob2JqZWN0Lmxlbmd0aCk7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgcGFpciA9IG9iamVjdFtpbmRleF07XG5cbiAgICBpZiAoJ1tvYmplY3QgT2JqZWN0XScgIT09IF90b1N0cmluZy5jYWxsKHBhaXIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAga2V5cyA9IE9iamVjdC5rZXlzKHBhaXIpO1xuXG4gICAgaWYgKDEgIT09IGtleXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmVzdWx0W2luZGV4XSA9IFsga2V5c1swXSwgcGFpcltrZXlzWzBdXSBdO1xuICB9XG5cbiAgc3RhdGUucmVzdWx0ID0gcmVzdWx0O1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpwYWlycycsIHtcbiAgbG9hZEtpbmQ6ICdzZXF1ZW5jZScsXG4gIGxvYWRSZXNvbHZlcjogcmVzb2x2ZVlhbWxQYWlyc1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6c2VxJywge1xuICBsb2FkS2luZDogJ3NlcXVlbmNlJ1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxudmFyIF9oYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxTZXQoc3RhdGUpIHtcbiAgdmFyIGtleSwgb2JqZWN0ID0gc3RhdGUucmVzdWx0O1xuXG4gIGZvciAoa2V5IGluIG9iamVjdCkge1xuICAgIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgIGlmIChudWxsICE9PSBvYmplY3Rba2V5XSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHlwZSgndGFnOnlhbWwub3JnLDIwMDI6c2V0Jywge1xuICBsb2FkS2luZDogJ21hcHBpbmcnLFxuICBsb2FkUmVzb2x2ZXI6IHJlc29sdmVZYW1sU2V0XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgVHlwZSA9IHJlcXVpcmUoJy4uL3R5cGUnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpzdHInLCB7XG4gIGxvYWRLaW5kOiAnc2NhbGFyJ1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIFR5cGUgPSByZXF1aXJlKCcuLi90eXBlJyk7XG5cblxudmFyIFlBTUxfVElNRVNUQU1QX1JFR0VYUCA9IG5ldyBSZWdFeHAoXG4gICdeKFswLTldWzAtOV1bMC05XVswLTldKScgICAgICAgICAgKyAvLyBbMV0geWVhclxuICAnLShbMC05XVswLTldPyknICAgICAgICAgICAgICAgICAgICsgLy8gWzJdIG1vbnRoXG4gICctKFswLTldWzAtOV0/KScgICAgICAgICAgICAgICAgICAgKyAvLyBbM10gZGF5XG4gICcoPzooPzpbVHRdfFsgXFxcXHRdKyknICAgICAgICAgICAgICArIC8vIC4uLlxuICAnKFswLTldWzAtOV0/KScgICAgICAgICAgICAgICAgICAgICsgLy8gWzRdIGhvdXJcbiAgJzooWzAtOV1bMC05XSknICAgICAgICAgICAgICAgICAgICArIC8vIFs1XSBtaW51dGVcbiAgJzooWzAtOV1bMC05XSknICAgICAgICAgICAgICAgICAgICArIC8vIFs2XSBzZWNvbmRcbiAgJyg/OlxcXFwuKFswLTldKikpPycgICAgICAgICAgICAgICAgICsgLy8gWzddIGZyYWN0aW9uXG4gICcoPzpbIFxcXFx0XSooWnwoWy0rXSkoWzAtOV1bMC05XT8pJyArIC8vIFs4XSB0eiBbOV0gdHpfc2lnbiBbMTBdIHR6X2hvdXJcbiAgJyg/OjooWzAtOV1bMC05XSkpPykpPyk/JCcpOyAgICAgICAgIC8vIFsxMV0gdHpfbWludXRlXG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxUaW1lc3RhbXAoc3RhdGUpIHtcbiAgdmFyIG1hdGNoLCB5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZCwgZnJhY3Rpb24gPSAwLFxuICAgICAgZGVsdGEgPSBudWxsLCB0el9ob3VyLCB0el9taW51dGUsIGRhdGE7XG5cbiAgbWF0Y2ggPSBZQU1MX1RJTUVTVEFNUF9SRUdFWFAuZXhlYyhzdGF0ZS5yZXN1bHQpO1xuXG4gIGlmIChudWxsID09PSBtYXRjaCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIG1hdGNoOiBbMV0geWVhciBbMl0gbW9udGggWzNdIGRheVxuXG4gIHllYXIgPSArKG1hdGNoWzFdKTtcbiAgbW9udGggPSArKG1hdGNoWzJdKSAtIDE7IC8vIEpTIG1vbnRoIHN0YXJ0cyB3aXRoIDBcbiAgZGF5ID0gKyhtYXRjaFszXSk7XG5cbiAgaWYgKCFtYXRjaFs0XSkgeyAvLyBubyBob3VyXG4gICAgc3RhdGUucmVzdWx0ID0gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGgsIGRheSkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gbWF0Y2g6IFs0XSBob3VyIFs1XSBtaW51dGUgWzZdIHNlY29uZCBbN10gZnJhY3Rpb25cblxuICBob3VyID0gKyhtYXRjaFs0XSk7XG4gIG1pbnV0ZSA9ICsobWF0Y2hbNV0pO1xuICBzZWNvbmQgPSArKG1hdGNoWzZdKTtcblxuICBpZiAobWF0Y2hbN10pIHtcbiAgICBmcmFjdGlvbiA9IG1hdGNoWzddLnNsaWNlKDAsIDMpO1xuICAgIHdoaWxlIChmcmFjdGlvbi5sZW5ndGggPCAzKSB7IC8vIG1pbGxpLXNlY29uZHNcbiAgICAgIGZyYWN0aW9uICs9ICcwJztcbiAgICB9XG4gICAgZnJhY3Rpb24gPSArZnJhY3Rpb247XG4gIH1cblxuICAvLyBtYXRjaDogWzhdIHR6IFs5XSB0el9zaWduIFsxMF0gdHpfaG91ciBbMTFdIHR6X21pbnV0ZVxuXG4gIGlmIChtYXRjaFs5XSkge1xuICAgIHR6X2hvdXIgPSArKG1hdGNoWzEwXSk7XG4gICAgdHpfbWludXRlID0gKyhtYXRjaFsxMV0gfHwgMCk7XG4gICAgZGVsdGEgPSAodHpfaG91ciAqIDYwICsgdHpfbWludXRlKSAqIDYwMDAwOyAvLyBkZWx0YSBpbiBtaWxpLXNlY29uZHNcbiAgICBpZiAoJy0nID09PSBtYXRjaFs5XSkge1xuICAgICAgZGVsdGEgPSAtZGVsdGE7XG4gICAgfVxuICB9XG5cbiAgZGF0YSA9IG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBmcmFjdGlvbikpO1xuXG4gIGlmIChkZWx0YSkge1xuICAgIGRhdGEuc2V0VGltZShkYXRhLmdldFRpbWUoKSAtIGRlbHRhKTtcbiAgfVxuXG4gIHN0YXRlLnJlc3VsdCA9IGRhdGE7XG4gIHJldHVybiB0cnVlO1xufVxuXG5cbmZ1bmN0aW9uIHJlcHJlc2VudFlhbWxUaW1lc3RhbXAob2JqZWN0IC8qLCBzdHlsZSovKSB7XG4gIHJldHVybiBvYmplY3QudG9JU09TdHJpbmcoKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUeXBlKCd0YWc6eWFtbC5vcmcsMjAwMjp0aW1lc3RhbXAnLCB7XG4gIGxvYWRLaW5kOiAnc2NhbGFyJyxcbiAgbG9hZFJlc29sdmVyOiByZXNvbHZlWWFtbFRpbWVzdGFtcCxcbiAgZHVtcEluc3RhbmNlT2Y6IERhdGUsXG4gIGR1bXBSZXByZXNlbnRlcjogcmVwcmVzZW50WWFtbFRpbWVzdGFtcFxufSk7XG4iLCIvKlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgQXJpeWEgSGlkYXlhdCA8YXJpeWEuaGlkYXlhdEBnbWFpbC5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMiBNYXRoaWFzIEJ5bmVucyA8bWF0aGlhc0BxaXdpLmJlPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgSm9vc3QtV2ltIEJvZWtlc3RlaWpuIDxqb29zdC13aW1AYm9la2VzdGVpam4ubmw+XG4gIENvcHlyaWdodCAoQykgMjAxMiBLcmlzIEtvd2FsIDxrcmlzLmtvd2FsQGNpeGFyLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIEFycGFkIEJvcnNvcyA8YXJwYWQuYm9yc29zQGdvb2dsZW1haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTEgQXJpeWEgSGlkYXlhdCA8YXJpeWEuaGlkYXlhdEBnbWFpbC5jb20+XG5cbiAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG5cbiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCJcbiAgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRVxuICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRVxuICBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgPENPUFlSSUdIVCBIT0xERVI+IEJFIExJQUJMRSBGT1IgQU5ZXG4gIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUztcbiAgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXG4gIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRlxuICBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuKi9cblxuLypqc2xpbnQgYml0d2lzZTp0cnVlIHBsdXNwbHVzOnRydWUgKi9cbi8qZ2xvYmFsIGVzcHJpbWE6dHJ1ZSwgZGVmaW5lOnRydWUsIGV4cG9ydHM6dHJ1ZSwgd2luZG93OiB0cnVlLFxudGhyb3dFcnJvcjogdHJ1ZSwgY3JlYXRlTGl0ZXJhbDogdHJ1ZSwgZ2VuZXJhdGVTdGF0ZW1lbnQ6IHRydWUsXG5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uOiB0cnVlLCBwYXJzZUJsb2NrOiB0cnVlLCBwYXJzZUV4cHJlc3Npb246IHRydWUsXG5wYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb246IHRydWUsIHBhcnNlRnVuY3Rpb25FeHByZXNzaW9uOiB0cnVlLFxucGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzOiB0cnVlLCBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcjogdHJ1ZSxcbnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbjogdHJ1ZSxcbnBhcnNlU3RhdGVtZW50OiB0cnVlLCBwYXJzZVNvdXJjZUVsZW1lbnQ6IHRydWUgKi9cblxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uIChVTUQpIHRvIHN1cHBvcnQgQU1ELCBDb21tb25KUy9Ob2RlLmpzLFxuICAgIC8vIFJoaW5vLCBhbmQgcGxhaW4gYnJvd3NlciBsb2FkaW5nLlxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmYWN0b3J5KGV4cG9ydHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoKHJvb3QuZXNwcmltYSA9IHt9KSk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoZXhwb3J0cykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBUb2tlbixcbiAgICAgICAgVG9rZW5OYW1lLFxuICAgICAgICBTeW50YXgsXG4gICAgICAgIFByb3BlcnR5S2luZCxcbiAgICAgICAgTWVzc2FnZXMsXG4gICAgICAgIFJlZ2V4LFxuICAgICAgICBzb3VyY2UsXG4gICAgICAgIHN0cmljdCxcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIGxpbmVOdW1iZXIsXG4gICAgICAgIGxpbmVTdGFydCxcbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICBidWZmZXIsXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBleHRyYTtcblxuICAgIFRva2VuID0ge1xuICAgICAgICBCb29sZWFuTGl0ZXJhbDogMSxcbiAgICAgICAgRU9GOiAyLFxuICAgICAgICBJZGVudGlmaWVyOiAzLFxuICAgICAgICBLZXl3b3JkOiA0LFxuICAgICAgICBOdWxsTGl0ZXJhbDogNSxcbiAgICAgICAgTnVtZXJpY0xpdGVyYWw6IDYsXG4gICAgICAgIFB1bmN0dWF0b3I6IDcsXG4gICAgICAgIFN0cmluZ0xpdGVyYWw6IDhcbiAgICB9O1xuXG4gICAgVG9rZW5OYW1lID0ge307XG4gICAgVG9rZW5OYW1lW1Rva2VuLkJvb2xlYW5MaXRlcmFsXSA9ICdCb29sZWFuJztcbiAgICBUb2tlbk5hbWVbVG9rZW4uRU9GXSA9ICc8ZW5kPic7XG4gICAgVG9rZW5OYW1lW1Rva2VuLklkZW50aWZpZXJdID0gJ0lkZW50aWZpZXInO1xuICAgIFRva2VuTmFtZVtUb2tlbi5LZXl3b3JkXSA9ICdLZXl3b3JkJztcbiAgICBUb2tlbk5hbWVbVG9rZW4uTnVsbExpdGVyYWxdID0gJ051bGwnO1xuICAgIFRva2VuTmFtZVtUb2tlbi5OdW1lcmljTGl0ZXJhbF0gPSAnTnVtZXJpYyc7XG4gICAgVG9rZW5OYW1lW1Rva2VuLlB1bmN0dWF0b3JdID0gJ1B1bmN0dWF0b3InO1xuICAgIFRva2VuTmFtZVtUb2tlbi5TdHJpbmdMaXRlcmFsXSA9ICdTdHJpbmcnO1xuXG4gICAgU3ludGF4ID0ge1xuICAgICAgICBBc3NpZ25tZW50RXhwcmVzc2lvbjogJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyxcbiAgICAgICAgQXJyYXlFeHByZXNzaW9uOiAnQXJyYXlFeHByZXNzaW9uJyxcbiAgICAgICAgQmxvY2tTdGF0ZW1lbnQ6ICdCbG9ja1N0YXRlbWVudCcsXG4gICAgICAgIEJpbmFyeUV4cHJlc3Npb246ICdCaW5hcnlFeHByZXNzaW9uJyxcbiAgICAgICAgQnJlYWtTdGF0ZW1lbnQ6ICdCcmVha1N0YXRlbWVudCcsXG4gICAgICAgIENhbGxFeHByZXNzaW9uOiAnQ2FsbEV4cHJlc3Npb24nLFxuICAgICAgICBDYXRjaENsYXVzZTogJ0NhdGNoQ2xhdXNlJyxcbiAgICAgICAgQ29uZGl0aW9uYWxFeHByZXNzaW9uOiAnQ29uZGl0aW9uYWxFeHByZXNzaW9uJyxcbiAgICAgICAgQ29udGludWVTdGF0ZW1lbnQ6ICdDb250aW51ZVN0YXRlbWVudCcsXG4gICAgICAgIERvV2hpbGVTdGF0ZW1lbnQ6ICdEb1doaWxlU3RhdGVtZW50JyxcbiAgICAgICAgRGVidWdnZXJTdGF0ZW1lbnQ6ICdEZWJ1Z2dlclN0YXRlbWVudCcsXG4gICAgICAgIEVtcHR5U3RhdGVtZW50OiAnRW1wdHlTdGF0ZW1lbnQnLFxuICAgICAgICBFeHByZXNzaW9uU3RhdGVtZW50OiAnRXhwcmVzc2lvblN0YXRlbWVudCcsXG4gICAgICAgIEZvclN0YXRlbWVudDogJ0ZvclN0YXRlbWVudCcsXG4gICAgICAgIEZvckluU3RhdGVtZW50OiAnRm9ySW5TdGF0ZW1lbnQnLFxuICAgICAgICBGdW5jdGlvbkRlY2xhcmF0aW9uOiAnRnVuY3Rpb25EZWNsYXJhdGlvbicsXG4gICAgICAgIEZ1bmN0aW9uRXhwcmVzc2lvbjogJ0Z1bmN0aW9uRXhwcmVzc2lvbicsXG4gICAgICAgIElkZW50aWZpZXI6ICdJZGVudGlmaWVyJyxcbiAgICAgICAgSWZTdGF0ZW1lbnQ6ICdJZlN0YXRlbWVudCcsXG4gICAgICAgIExpdGVyYWw6ICdMaXRlcmFsJyxcbiAgICAgICAgTGFiZWxlZFN0YXRlbWVudDogJ0xhYmVsZWRTdGF0ZW1lbnQnLFxuICAgICAgICBMb2dpY2FsRXhwcmVzc2lvbjogJ0xvZ2ljYWxFeHByZXNzaW9uJyxcbiAgICAgICAgTWVtYmVyRXhwcmVzc2lvbjogJ01lbWJlckV4cHJlc3Npb24nLFxuICAgICAgICBOZXdFeHByZXNzaW9uOiAnTmV3RXhwcmVzc2lvbicsXG4gICAgICAgIE9iamVjdEV4cHJlc3Npb246ICdPYmplY3RFeHByZXNzaW9uJyxcbiAgICAgICAgUHJvZ3JhbTogJ1Byb2dyYW0nLFxuICAgICAgICBQcm9wZXJ0eTogJ1Byb3BlcnR5JyxcbiAgICAgICAgUmV0dXJuU3RhdGVtZW50OiAnUmV0dXJuU3RhdGVtZW50JyxcbiAgICAgICAgU2VxdWVuY2VFeHByZXNzaW9uOiAnU2VxdWVuY2VFeHByZXNzaW9uJyxcbiAgICAgICAgU3dpdGNoU3RhdGVtZW50OiAnU3dpdGNoU3RhdGVtZW50JyxcbiAgICAgICAgU3dpdGNoQ2FzZTogJ1N3aXRjaENhc2UnLFxuICAgICAgICBUaGlzRXhwcmVzc2lvbjogJ1RoaXNFeHByZXNzaW9uJyxcbiAgICAgICAgVGhyb3dTdGF0ZW1lbnQ6ICdUaHJvd1N0YXRlbWVudCcsXG4gICAgICAgIFRyeVN0YXRlbWVudDogJ1RyeVN0YXRlbWVudCcsXG4gICAgICAgIFVuYXJ5RXhwcmVzc2lvbjogJ1VuYXJ5RXhwcmVzc2lvbicsXG4gICAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdVcGRhdGVFeHByZXNzaW9uJyxcbiAgICAgICAgVmFyaWFibGVEZWNsYXJhdGlvbjogJ1ZhcmlhYmxlRGVjbGFyYXRpb24nLFxuICAgICAgICBWYXJpYWJsZURlY2xhcmF0b3I6ICdWYXJpYWJsZURlY2xhcmF0b3InLFxuICAgICAgICBXaGlsZVN0YXRlbWVudDogJ1doaWxlU3RhdGVtZW50JyxcbiAgICAgICAgV2l0aFN0YXRlbWVudDogJ1dpdGhTdGF0ZW1lbnQnXG4gICAgfTtcblxuICAgIFByb3BlcnR5S2luZCA9IHtcbiAgICAgICAgRGF0YTogMSxcbiAgICAgICAgR2V0OiAyLFxuICAgICAgICBTZXQ6IDRcbiAgICB9O1xuXG4gICAgLy8gRXJyb3IgbWVzc2FnZXMgc2hvdWxkIGJlIGlkZW50aWNhbCB0byBWOC5cbiAgICBNZXNzYWdlcyA9IHtcbiAgICAgICAgVW5leHBlY3RlZFRva2VuOiAgJ1VuZXhwZWN0ZWQgdG9rZW4gJTAnLFxuICAgICAgICBVbmV4cGVjdGVkTnVtYmVyOiAgJ1VuZXhwZWN0ZWQgbnVtYmVyJyxcbiAgICAgICAgVW5leHBlY3RlZFN0cmluZzogICdVbmV4cGVjdGVkIHN0cmluZycsXG4gICAgICAgIFVuZXhwZWN0ZWRJZGVudGlmaWVyOiAgJ1VuZXhwZWN0ZWQgaWRlbnRpZmllcicsXG4gICAgICAgIFVuZXhwZWN0ZWRSZXNlcnZlZDogICdVbmV4cGVjdGVkIHJlc2VydmVkIHdvcmQnLFxuICAgICAgICBVbmV4cGVjdGVkRU9TOiAgJ1VuZXhwZWN0ZWQgZW5kIG9mIGlucHV0JyxcbiAgICAgICAgTmV3bGluZUFmdGVyVGhyb3c6ICAnSWxsZWdhbCBuZXdsaW5lIGFmdGVyIHRocm93JyxcbiAgICAgICAgSW52YWxpZFJlZ0V4cDogJ0ludmFsaWQgcmVndWxhciBleHByZXNzaW9uJyxcbiAgICAgICAgVW50ZXJtaW5hdGVkUmVnRXhwOiAgJ0ludmFsaWQgcmVndWxhciBleHByZXNzaW9uOiBtaXNzaW5nIC8nLFxuICAgICAgICBJbnZhbGlkTEhTSW5Bc3NpZ25tZW50OiAgJ0ludmFsaWQgbGVmdC1oYW5kIHNpZGUgaW4gYXNzaWdubWVudCcsXG4gICAgICAgIEludmFsaWRMSFNJbkZvckluOiAgJ0ludmFsaWQgbGVmdC1oYW5kIHNpZGUgaW4gZm9yLWluJyxcbiAgICAgICAgTXVsdGlwbGVEZWZhdWx0c0luU3dpdGNoOiAnTW9yZSB0aGFuIG9uZSBkZWZhdWx0IGNsYXVzZSBpbiBzd2l0Y2ggc3RhdGVtZW50JyxcbiAgICAgICAgTm9DYXRjaE9yRmluYWxseTogICdNaXNzaW5nIGNhdGNoIG9yIGZpbmFsbHkgYWZ0ZXIgdHJ5JyxcbiAgICAgICAgVW5rbm93bkxhYmVsOiAnVW5kZWZpbmVkIGxhYmVsIFxcJyUwXFwnJyxcbiAgICAgICAgUmVkZWNsYXJhdGlvbjogJyUwIFxcJyUxXFwnIGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWQnLFxuICAgICAgICBJbGxlZ2FsQ29udGludWU6ICdJbGxlZ2FsIGNvbnRpbnVlIHN0YXRlbWVudCcsXG4gICAgICAgIElsbGVnYWxCcmVhazogJ0lsbGVnYWwgYnJlYWsgc3RhdGVtZW50JyxcbiAgICAgICAgSWxsZWdhbFJldHVybjogJ0lsbGVnYWwgcmV0dXJuIHN0YXRlbWVudCcsXG4gICAgICAgIFN0cmljdE1vZGVXaXRoOiAgJ1N0cmljdCBtb2RlIGNvZGUgbWF5IG5vdCBpbmNsdWRlIGEgd2l0aCBzdGF0ZW1lbnQnLFxuICAgICAgICBTdHJpY3RDYXRjaFZhcmlhYmxlOiAgJ0NhdGNoIHZhcmlhYmxlIG1heSBub3QgYmUgZXZhbCBvciBhcmd1bWVudHMgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RWYXJOYW1lOiAgJ1ZhcmlhYmxlIG5hbWUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdFBhcmFtTmFtZTogICdQYXJhbWV0ZXIgbmFtZSBldmFsIG9yIGFyZ3VtZW50cyBpcyBub3QgYWxsb3dlZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdFBhcmFtRHVwZTogJ1N0cmljdCBtb2RlIGZ1bmN0aW9uIG1heSBub3QgaGF2ZSBkdXBsaWNhdGUgcGFyYW1ldGVyIG5hbWVzJyxcbiAgICAgICAgU3RyaWN0RnVuY3Rpb25OYW1lOiAgJ0Z1bmN0aW9uIG5hbWUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdE9jdGFsTGl0ZXJhbDogICdPY3RhbCBsaXRlcmFscyBhcmUgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUuJyxcbiAgICAgICAgU3RyaWN0RGVsZXRlOiAgJ0RlbGV0ZSBvZiBhbiB1bnF1YWxpZmllZCBpZGVudGlmaWVyIGluIHN0cmljdCBtb2RlLicsXG4gICAgICAgIFN0cmljdER1cGxpY2F0ZVByb3BlcnR5OiAgJ0R1cGxpY2F0ZSBkYXRhIHByb3BlcnR5IGluIG9iamVjdCBsaXRlcmFsIG5vdCBhbGxvd2VkIGluIHN0cmljdCBtb2RlJyxcbiAgICAgICAgQWNjZXNzb3JEYXRhUHJvcGVydHk6ICAnT2JqZWN0IGxpdGVyYWwgbWF5IG5vdCBoYXZlIGRhdGEgYW5kIGFjY2Vzc29yIHByb3BlcnR5IHdpdGggdGhlIHNhbWUgbmFtZScsXG4gICAgICAgIEFjY2Vzc29yR2V0U2V0OiAgJ09iamVjdCBsaXRlcmFsIG1heSBub3QgaGF2ZSBtdWx0aXBsZSBnZXQvc2V0IGFjY2Vzc29ycyB3aXRoIHRoZSBzYW1lIG5hbWUnLFxuICAgICAgICBTdHJpY3RMSFNBc3NpZ25tZW50OiAgJ0Fzc2lnbm1lbnQgdG8gZXZhbCBvciBhcmd1bWVudHMgaXMgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RMSFNQb3N0Zml4OiAgJ1Bvc3RmaXggaW5jcmVtZW50L2RlY3JlbWVudCBtYXkgbm90IGhhdmUgZXZhbCBvciBhcmd1bWVudHMgb3BlcmFuZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdExIU1ByZWZpeDogICdQcmVmaXggaW5jcmVtZW50L2RlY3JlbWVudCBtYXkgbm90IGhhdmUgZXZhbCBvciBhcmd1bWVudHMgb3BlcmFuZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdFJlc2VydmVkV29yZDogICdVc2Ugb2YgZnV0dXJlIHJlc2VydmVkIHdvcmQgaW4gc3RyaWN0IG1vZGUnXG4gICAgfTtcblxuICAgIC8vIFNlZSBhbHNvIHRvb2xzL2dlbmVyYXRlLXVuaWNvZGUtcmVnZXgucHkuXG4gICAgUmVnZXggPSB7XG4gICAgICAgIE5vbkFzY2lpSWRlbnRpZmllclN0YXJ0OiBuZXcgUmVnRXhwKCdbXFx4YWFcXHhiNVxceGJhXFx4YzAtXFx4ZDZcXHhkOC1cXHhmNlxceGY4LVxcdTAyYzFcXHUwMmM2LVxcdTAyZDFcXHUwMmUwLVxcdTAyZTRcXHUwMmVjXFx1MDJlZVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3YS1cXHUwMzdkXFx1MDM4NlxcdTAzODgtXFx1MDM4YVxcdTAzOGNcXHUwMzhlLVxcdTAzYTFcXHUwM2EzLVxcdTAzZjVcXHUwM2Y3LVxcdTA0ODFcXHUwNDhhLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVkMC1cXHUwNWVhXFx1MDVmMC1cXHUwNWYyXFx1MDYyMC1cXHUwNjRhXFx1MDY2ZVxcdTA2NmZcXHUwNjcxLVxcdTA2ZDNcXHUwNmQ1XFx1MDZlNVxcdTA2ZTZcXHUwNmVlXFx1MDZlZlxcdTA2ZmEtXFx1MDZmY1xcdTA2ZmZcXHUwNzEwXFx1MDcxMi1cXHUwNzJmXFx1MDc0ZC1cXHUwN2E1XFx1MDdiMVxcdTA3Y2EtXFx1MDdlYVxcdTA3ZjRcXHUwN2Y1XFx1MDdmYVxcdTA4MDAtXFx1MDgxNVxcdTA4MWFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4YTBcXHUwOGEyLVxcdTA4YWNcXHUwOTA0LVxcdTA5MzlcXHUwOTNkXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk3N1xcdTA5NzktXFx1MDk3ZlxcdTA5ODUtXFx1MDk4Y1xcdTA5OGZcXHUwOTkwXFx1MDk5My1cXHUwOWE4XFx1MDlhYS1cXHUwOWIwXFx1MDliMlxcdTA5YjYtXFx1MDliOVxcdTA5YmRcXHUwOWNlXFx1MDlkY1xcdTA5ZGRcXHUwOWRmLVxcdTA5ZTFcXHUwOWYwXFx1MDlmMVxcdTBhMDUtXFx1MGEwYVxcdTBhMGZcXHUwYTEwXFx1MGExMy1cXHUwYTI4XFx1MGEyYS1cXHUwYTMwXFx1MGEzMlxcdTBhMzNcXHUwYTM1XFx1MGEzNlxcdTBhMzhcXHUwYTM5XFx1MGE1OS1cXHUwYTVjXFx1MGE1ZVxcdTBhNzItXFx1MGE3NFxcdTBhODUtXFx1MGE4ZFxcdTBhOGYtXFx1MGE5MVxcdTBhOTMtXFx1MGFhOFxcdTBhYWEtXFx1MGFiMFxcdTBhYjJcXHUwYWIzXFx1MGFiNS1cXHUwYWI5XFx1MGFiZFxcdTBhZDBcXHUwYWUwXFx1MGFlMVxcdTBiMDUtXFx1MGIwY1xcdTBiMGZcXHUwYjEwXFx1MGIxMy1cXHUwYjI4XFx1MGIyYS1cXHUwYjMwXFx1MGIzMlxcdTBiMzNcXHUwYjM1LVxcdTBiMzlcXHUwYjNkXFx1MGI1Y1xcdTBiNWRcXHUwYjVmLVxcdTBiNjFcXHUwYjcxXFx1MGI4M1xcdTBiODUtXFx1MGI4YVxcdTBiOGUtXFx1MGI5MFxcdTBiOTItXFx1MGI5NVxcdTBiOTlcXHUwYjlhXFx1MGI5Y1xcdTBiOWVcXHUwYjlmXFx1MGJhM1xcdTBiYTRcXHUwYmE4LVxcdTBiYWFcXHUwYmFlLVxcdTBiYjlcXHUwYmQwXFx1MGMwNS1cXHUwYzBjXFx1MGMwZS1cXHUwYzEwXFx1MGMxMi1cXHUwYzI4XFx1MGMyYS1cXHUwYzMzXFx1MGMzNS1cXHUwYzM5XFx1MGMzZFxcdTBjNThcXHUwYzU5XFx1MGM2MFxcdTBjNjFcXHUwYzg1LVxcdTBjOGNcXHUwYzhlLVxcdTBjOTBcXHUwYzkyLVxcdTBjYThcXHUwY2FhLVxcdTBjYjNcXHUwY2I1LVxcdTBjYjlcXHUwY2JkXFx1MGNkZVxcdTBjZTBcXHUwY2UxXFx1MGNmMVxcdTBjZjJcXHUwZDA1LVxcdTBkMGNcXHUwZDBlLVxcdTBkMTBcXHUwZDEyLVxcdTBkM2FcXHUwZDNkXFx1MGQ0ZVxcdTBkNjBcXHUwZDYxXFx1MGQ3YS1cXHUwZDdmXFx1MGQ4NS1cXHUwZDk2XFx1MGQ5YS1cXHUwZGIxXFx1MGRiMy1cXHUwZGJiXFx1MGRiZFxcdTBkYzAtXFx1MGRjNlxcdTBlMDEtXFx1MGUzMFxcdTBlMzJcXHUwZTMzXFx1MGU0MC1cXHUwZTQ2XFx1MGU4MVxcdTBlODJcXHUwZTg0XFx1MGU4N1xcdTBlODhcXHUwZThhXFx1MGU4ZFxcdTBlOTQtXFx1MGU5N1xcdTBlOTktXFx1MGU5ZlxcdTBlYTEtXFx1MGVhM1xcdTBlYTVcXHUwZWE3XFx1MGVhYVxcdTBlYWJcXHUwZWFkLVxcdTBlYjBcXHUwZWIyXFx1MGViM1xcdTBlYmRcXHUwZWMwLVxcdTBlYzRcXHUwZWM2XFx1MGVkYy1cXHUwZWRmXFx1MGYwMFxcdTBmNDAtXFx1MGY0N1xcdTBmNDktXFx1MGY2Y1xcdTBmODgtXFx1MGY4Y1xcdTEwMDAtXFx1MTAyYVxcdTEwM2ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVhLVxcdTEwNWRcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZlLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhlXFx1MTBhMC1cXHUxMGM1XFx1MTBjN1xcdTEwY2RcXHUxMGQwLVxcdTEwZmFcXHUxMGZjLVxcdTEyNDhcXHUxMjRhLVxcdTEyNGRcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1YS1cXHUxMjVkXFx1MTI2MC1cXHUxMjg4XFx1MTI4YS1cXHUxMjhkXFx1MTI5MC1cXHUxMmIwXFx1MTJiMi1cXHUxMmI1XFx1MTJiOC1cXHUxMmJlXFx1MTJjMFxcdTEyYzItXFx1MTJjNVxcdTEyYzgtXFx1MTJkNlxcdTEyZDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1YVxcdTEzODAtXFx1MTM4ZlxcdTEzYTAtXFx1MTNmNFxcdTE0MDEtXFx1MTY2Y1xcdTE2NmYtXFx1MTY3ZlxcdTE2ODEtXFx1MTY5YVxcdTE2YTAtXFx1MTZlYVxcdTE2ZWUtXFx1MTZmMFxcdTE3MDAtXFx1MTcwY1xcdTE3MGUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Y1xcdTE3NmUtXFx1MTc3MFxcdTE3ODAtXFx1MTdiM1xcdTE3ZDdcXHUxN2RjXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOGE4XFx1MThhYVxcdTE4YjAtXFx1MThmNVxcdTE5MDAtXFx1MTkxY1xcdTE5NTAtXFx1MTk2ZFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlhYlxcdTE5YzEtXFx1MTljN1xcdTFhMDAtXFx1MWExNlxcdTFhMjAtXFx1MWE1NFxcdTFhYTdcXHUxYjA1LVxcdTFiMzNcXHUxYjQ1LVxcdTFiNGJcXHUxYjgzLVxcdTFiYTBcXHUxYmFlXFx1MWJhZlxcdTFiYmEtXFx1MWJlNVxcdTFjMDAtXFx1MWMyM1xcdTFjNGQtXFx1MWM0ZlxcdTFjNWEtXFx1MWM3ZFxcdTFjZTktXFx1MWNlY1xcdTFjZWUtXFx1MWNmMVxcdTFjZjVcXHUxY2Y2XFx1MWQwMC1cXHUxZGJmXFx1MWUwMC1cXHUxZjE1XFx1MWYxOC1cXHUxZjFkXFx1MWYyMC1cXHUxZjQ1XFx1MWY0OC1cXHUxZjRkXFx1MWY1MC1cXHUxZjU3XFx1MWY1OVxcdTFmNWJcXHUxZjVkXFx1MWY1Zi1cXHUxZjdkXFx1MWY4MC1cXHUxZmI0XFx1MWZiNi1cXHUxZmJjXFx1MWZiZVxcdTFmYzItXFx1MWZjNFxcdTFmYzYtXFx1MWZjY1xcdTFmZDAtXFx1MWZkM1xcdTFmZDYtXFx1MWZkYlxcdTFmZTAtXFx1MWZlY1xcdTFmZjItXFx1MWZmNFxcdTFmZjYtXFx1MWZmY1xcdTIwNzFcXHUyMDdmXFx1MjA5MC1cXHUyMDljXFx1MjEwMlxcdTIxMDdcXHUyMTBhLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFkXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyYS1cXHUyMTJkXFx1MjEyZi1cXHUyMTM5XFx1MjEzYy1cXHUyMTNmXFx1MjE0NS1cXHUyMTQ5XFx1MjE0ZVxcdTIxNjAtXFx1MjE4OFxcdTJjMDAtXFx1MmMyZVxcdTJjMzAtXFx1MmM1ZVxcdTJjNjAtXFx1MmNlNFxcdTJjZWItXFx1MmNlZVxcdTJjZjJcXHUyY2YzXFx1MmQwMC1cXHUyZDI1XFx1MmQyN1xcdTJkMmRcXHUyZDMwLVxcdTJkNjdcXHUyZDZmXFx1MmQ4MC1cXHUyZDk2XFx1MmRhMC1cXHUyZGE2XFx1MmRhOC1cXHUyZGFlXFx1MmRiMC1cXHUyZGI2XFx1MmRiOC1cXHUyZGJlXFx1MmRjMC1cXHUyZGM2XFx1MmRjOC1cXHUyZGNlXFx1MmRkMC1cXHUyZGQ2XFx1MmRkOC1cXHUyZGRlXFx1MmUyZlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzY1xcdTMwNDEtXFx1MzA5NlxcdTMwOWQtXFx1MzA5ZlxcdTMwYTEtXFx1MzBmYVxcdTMwZmMtXFx1MzBmZlxcdTMxMDUtXFx1MzEyZFxcdTMxMzEtXFx1MzE4ZVxcdTMxYTAtXFx1MzFiYVxcdTMxZjAtXFx1MzFmZlxcdTM0MDAtXFx1NGRiNVxcdTRlMDAtXFx1OWZjY1xcdWEwMDAtXFx1YTQ4Y1xcdWE0ZDAtXFx1YTRmZFxcdWE1MDAtXFx1YTYwY1xcdWE2MTAtXFx1YTYxZlxcdWE2MmFcXHVhNjJiXFx1YTY0MC1cXHVhNjZlXFx1YTY3Zi1cXHVhNjk3XFx1YTZhMC1cXHVhNmVmXFx1YTcxNy1cXHVhNzFmXFx1YTcyMi1cXHVhNzg4XFx1YTc4Yi1cXHVhNzhlXFx1YTc5MC1cXHVhNzkzXFx1YTdhMC1cXHVhN2FhXFx1YTdmOC1cXHVhODAxXFx1YTgwMy1cXHVhODA1XFx1YTgwNy1cXHVhODBhXFx1YTgwYy1cXHVhODIyXFx1YTg0MC1cXHVhODczXFx1YTg4Mi1cXHVhOGIzXFx1YThmMi1cXHVhOGY3XFx1YThmYlxcdWE5MGEtXFx1YTkyNVxcdWE5MzAtXFx1YTk0NlxcdWE5NjAtXFx1YTk3Y1xcdWE5ODQtXFx1YTliMlxcdWE5Y2ZcXHVhYTAwLVxcdWFhMjhcXHVhYTQwLVxcdWFhNDJcXHVhYTQ0LVxcdWFhNGJcXHVhYTYwLVxcdWFhNzZcXHVhYTdhXFx1YWE4MC1cXHVhYWFmXFx1YWFiMVxcdWFhYjVcXHVhYWI2XFx1YWFiOS1cXHVhYWJkXFx1YWFjMFxcdWFhYzJcXHVhYWRiLVxcdWFhZGRcXHVhYWUwLVxcdWFhZWFcXHVhYWYyLVxcdWFhZjRcXHVhYjAxLVxcdWFiMDZcXHVhYjA5LVxcdWFiMGVcXHVhYjExLVxcdWFiMTZcXHVhYjIwLVxcdWFiMjZcXHVhYjI4LVxcdWFiMmVcXHVhYmMwLVxcdWFiZTJcXHVhYzAwLVxcdWQ3YTNcXHVkN2IwLVxcdWQ3YzZcXHVkN2NiLVxcdWQ3ZmJcXHVmOTAwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjAwLVxcdWZiMDZcXHVmYjEzLVxcdWZiMTdcXHVmYjFkXFx1ZmIxZi1cXHVmYjI4XFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDBcXHVmYjQxXFx1ZmI0M1xcdWZiNDRcXHVmYjQ2LVxcdWZiYjFcXHVmYmQzLVxcdWZkM2RcXHVmZDUwLVxcdWZkOGZcXHVmZDkyLVxcdWZkYzdcXHVmZGYwLVxcdWZkZmJcXHVmZTcwLVxcdWZlNzRcXHVmZTc2LVxcdWZlZmNcXHVmZjIxLVxcdWZmM2FcXHVmZjQxLVxcdWZmNWFcXHVmZjY2LVxcdWZmYmVcXHVmZmMyLVxcdWZmYzdcXHVmZmNhLVxcdWZmY2ZcXHVmZmQyLVxcdWZmZDdcXHVmZmRhLVxcdWZmZGNdJyksXG4gICAgICAgIE5vbkFzY2lpSWRlbnRpZmllclBhcnQ6IG5ldyBSZWdFeHAoJ1tcXHhhYVxceGI1XFx4YmFcXHhjMC1cXHhkNlxceGQ4LVxceGY2XFx4ZjgtXFx1MDJjMVxcdTAyYzYtXFx1MDJkMVxcdTAyZTAtXFx1MDJlNFxcdTAyZWNcXHUwMmVlXFx1MDMwMC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdhLVxcdTAzN2RcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0ODMtXFx1MDQ4N1xcdTA0OGEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNTkxLVxcdTA1YmRcXHUwNWJmXFx1MDVjMVxcdTA1YzJcXHUwNWM0XFx1MDVjNVxcdTA1YzdcXHUwNWQwLVxcdTA1ZWFcXHUwNWYwLVxcdTA1ZjJcXHUwNjEwLVxcdTA2MWFcXHUwNjIwLVxcdTA2NjlcXHUwNjZlLVxcdTA2ZDNcXHUwNmQ1LVxcdTA2ZGNcXHUwNmRmLVxcdTA2ZThcXHUwNmVhLVxcdTA2ZmNcXHUwNmZmXFx1MDcxMC1cXHUwNzRhXFx1MDc0ZC1cXHUwN2IxXFx1MDdjMC1cXHUwN2Y1XFx1MDdmYVxcdTA4MDAtXFx1MDgyZFxcdTA4NDAtXFx1MDg1YlxcdTA4YTBcXHUwOGEyLVxcdTA4YWNcXHUwOGU0LVxcdTA4ZmVcXHUwOTAwLVxcdTA5NjNcXHUwOTY2LVxcdTA5NmZcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N2ZcXHUwOTgxLVxcdTA5ODNcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJjLVxcdTA5YzRcXHUwOWM3XFx1MDljOFxcdTA5Y2ItXFx1MDljZVxcdTA5ZDdcXHUwOWRjXFx1MDlkZFxcdTA5ZGYtXFx1MDllM1xcdTA5ZTYtXFx1MDlmMVxcdTBhMDEtXFx1MGEwM1xcdTBhMDUtXFx1MGEwYVxcdTBhMGZcXHUwYTEwXFx1MGExMy1cXHUwYTI4XFx1MGEyYS1cXHUwYTMwXFx1MGEzMlxcdTBhMzNcXHUwYTM1XFx1MGEzNlxcdTBhMzhcXHUwYTM5XFx1MGEzY1xcdTBhM2UtXFx1MGE0MlxcdTBhNDdcXHUwYTQ4XFx1MGE0Yi1cXHUwYTRkXFx1MGE1MVxcdTBhNTktXFx1MGE1Y1xcdTBhNWVcXHUwYTY2LVxcdTBhNzVcXHUwYTgxLVxcdTBhODNcXHUwYTg1LVxcdTBhOGRcXHUwYThmLVxcdTBhOTFcXHUwYTkzLVxcdTBhYThcXHUwYWFhLVxcdTBhYjBcXHUwYWIyXFx1MGFiM1xcdTBhYjUtXFx1MGFiOVxcdTBhYmMtXFx1MGFjNVxcdTBhYzctXFx1MGFjOVxcdTBhY2ItXFx1MGFjZFxcdTBhZDBcXHUwYWUwLVxcdTBhZTNcXHUwYWU2LVxcdTBhZWZcXHUwYjAxLVxcdTBiMDNcXHUwYjA1LVxcdTBiMGNcXHUwYjBmXFx1MGIxMFxcdTBiMTMtXFx1MGIyOFxcdTBiMmEtXFx1MGIzMFxcdTBiMzJcXHUwYjMzXFx1MGIzNS1cXHUwYjM5XFx1MGIzYy1cXHUwYjQ0XFx1MGI0N1xcdTBiNDhcXHUwYjRiLVxcdTBiNGRcXHUwYjU2XFx1MGI1N1xcdTBiNWNcXHUwYjVkXFx1MGI1Zi1cXHUwYjYzXFx1MGI2Ni1cXHUwYjZmXFx1MGI3MVxcdTBiODJcXHUwYjgzXFx1MGI4NS1cXHUwYjhhXFx1MGI4ZS1cXHUwYjkwXFx1MGI5Mi1cXHUwYjk1XFx1MGI5OVxcdTBiOWFcXHUwYjljXFx1MGI5ZVxcdTBiOWZcXHUwYmEzXFx1MGJhNFxcdTBiYTgtXFx1MGJhYVxcdTBiYWUtXFx1MGJiOVxcdTBiYmUtXFx1MGJjMlxcdTBiYzYtXFx1MGJjOFxcdTBiY2EtXFx1MGJjZFxcdTBiZDBcXHUwYmQ3XFx1MGJlNi1cXHUwYmVmXFx1MGMwMS1cXHUwYzAzXFx1MGMwNS1cXHUwYzBjXFx1MGMwZS1cXHUwYzEwXFx1MGMxMi1cXHUwYzI4XFx1MGMyYS1cXHUwYzMzXFx1MGMzNS1cXHUwYzM5XFx1MGMzZC1cXHUwYzQ0XFx1MGM0Ni1cXHUwYzQ4XFx1MGM0YS1cXHUwYzRkXFx1MGM1NVxcdTBjNTZcXHUwYzU4XFx1MGM1OVxcdTBjNjAtXFx1MGM2M1xcdTBjNjYtXFx1MGM2ZlxcdTBjODJcXHUwYzgzXFx1MGM4NS1cXHUwYzhjXFx1MGM4ZS1cXHUwYzkwXFx1MGM5Mi1cXHUwY2E4XFx1MGNhYS1cXHUwY2IzXFx1MGNiNS1cXHUwY2I5XFx1MGNiYy1cXHUwY2M0XFx1MGNjNi1cXHUwY2M4XFx1MGNjYS1cXHUwY2NkXFx1MGNkNVxcdTBjZDZcXHUwY2RlXFx1MGNlMC1cXHUwY2UzXFx1MGNlNi1cXHUwY2VmXFx1MGNmMVxcdTBjZjJcXHUwZDAyXFx1MGQwM1xcdTBkMDUtXFx1MGQwY1xcdTBkMGUtXFx1MGQxMFxcdTBkMTItXFx1MGQzYVxcdTBkM2QtXFx1MGQ0NFxcdTBkNDYtXFx1MGQ0OFxcdTBkNGEtXFx1MGQ0ZVxcdTBkNTdcXHUwZDYwLVxcdTBkNjNcXHUwZDY2LVxcdTBkNmZcXHUwZDdhLVxcdTBkN2ZcXHUwZDgyXFx1MGQ4M1xcdTBkODUtXFx1MGQ5NlxcdTBkOWEtXFx1MGRiMVxcdTBkYjMtXFx1MGRiYlxcdTBkYmRcXHUwZGMwLVxcdTBkYzZcXHUwZGNhXFx1MGRjZi1cXHUwZGQ0XFx1MGRkNlxcdTBkZDgtXFx1MGRkZlxcdTBkZjJcXHUwZGYzXFx1MGUwMS1cXHUwZTNhXFx1MGU0MC1cXHUwZTRlXFx1MGU1MC1cXHUwZTU5XFx1MGU4MVxcdTBlODJcXHUwZTg0XFx1MGU4N1xcdTBlODhcXHUwZThhXFx1MGU4ZFxcdTBlOTQtXFx1MGU5N1xcdTBlOTktXFx1MGU5ZlxcdTBlYTEtXFx1MGVhM1xcdTBlYTVcXHUwZWE3XFx1MGVhYVxcdTBlYWJcXHUwZWFkLVxcdTBlYjlcXHUwZWJiLVxcdTBlYmRcXHUwZWMwLVxcdTBlYzRcXHUwZWM2XFx1MGVjOC1cXHUwZWNkXFx1MGVkMC1cXHUwZWQ5XFx1MGVkYy1cXHUwZWRmXFx1MGYwMFxcdTBmMThcXHUwZjE5XFx1MGYyMC1cXHUwZjI5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGYzZS1cXHUwZjQ3XFx1MGY0OS1cXHUwZjZjXFx1MGY3MS1cXHUwZjg0XFx1MGY4Ni1cXHUwZjk3XFx1MGY5OS1cXHUwZmJjXFx1MGZjNlxcdTEwMDAtXFx1MTA0OVxcdTEwNTAtXFx1MTA5ZFxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzVkLVxcdTEzNWZcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjBcXHUxNzAwLVxcdTE3MGNcXHUxNzBlLVxcdTE3MTRcXHUxNzIwLVxcdTE3MzRcXHUxNzQwLVxcdTE3NTNcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzcyXFx1MTc3M1xcdTE3ODAtXFx1MTdkM1xcdTE3ZDdcXHUxN2RjXFx1MTdkZFxcdTE3ZTAtXFx1MTdlOVxcdTE4MGItXFx1MTgwZFxcdTE4MTAtXFx1MTgxOVxcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThhYVxcdTE4YjAtXFx1MThmNVxcdTE5MDAtXFx1MTkxY1xcdTE5MjAtXFx1MTkyYlxcdTE5MzAtXFx1MTkzYlxcdTE5NDYtXFx1MTk2ZFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlhYlxcdTE5YjAtXFx1MTljOVxcdTE5ZDAtXFx1MTlkOVxcdTFhMDAtXFx1MWExYlxcdTFhMjAtXFx1MWE1ZVxcdTFhNjAtXFx1MWE3Y1xcdTFhN2YtXFx1MWE4OVxcdTFhOTAtXFx1MWE5OVxcdTFhYTdcXHUxYjAwLVxcdTFiNGJcXHUxYjUwLVxcdTFiNTlcXHUxYjZiLVxcdTFiNzNcXHUxYjgwLVxcdTFiZjNcXHUxYzAwLVxcdTFjMzdcXHUxYzQwLVxcdTFjNDlcXHUxYzRkLVxcdTFjN2RcXHUxY2QwLVxcdTFjZDJcXHUxY2Q0LVxcdTFjZjZcXHUxZDAwLVxcdTFkZTZcXHUxZGZjLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjAwY1xcdTIwMGRcXHUyMDNmXFx1MjA0MFxcdTIwNTRcXHUyMDcxXFx1MjA3ZlxcdTIwOTAtXFx1MjA5Y1xcdTIwZDAtXFx1MjBkY1xcdTIwZTFcXHUyMGU1LVxcdTIwZjBcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMmRcXHUyMTJmLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyYzJlXFx1MmMzMC1cXHUyYzVlXFx1MmM2MC1cXHUyY2U0XFx1MmNlYi1cXHUyY2YzXFx1MmQwMC1cXHUyZDI1XFx1MmQyN1xcdTJkMmRcXHUyZDMwLVxcdTJkNjdcXHUyZDZmXFx1MmQ3Zi1cXHUyZDk2XFx1MmRhMC1cXHUyZGE2XFx1MmRhOC1cXHUyZGFlXFx1MmRiMC1cXHUyZGI2XFx1MmRiOC1cXHUyZGJlXFx1MmRjMC1cXHUyZGM2XFx1MmRjOC1cXHUyZGNlXFx1MmRkMC1cXHUyZGQ2XFx1MmRkOC1cXHUyZGRlXFx1MmRlMC1cXHUyZGZmXFx1MmUyZlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyZlxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzY1xcdTMwNDEtXFx1MzA5NlxcdTMwOTlcXHUzMDlhXFx1MzA5ZC1cXHUzMDlmXFx1MzBhMS1cXHUzMGZhXFx1MzBmYy1cXHUzMGZmXFx1MzEwNS1cXHUzMTJkXFx1MzEzMS1cXHUzMThlXFx1MzFhMC1cXHUzMWJhXFx1MzFmMC1cXHUzMWZmXFx1MzQwMC1cXHU0ZGI1XFx1NGUwMC1cXHU5ZmNjXFx1YTAwMC1cXHVhNDhjXFx1YTRkMC1cXHVhNGZkXFx1YTUwMC1cXHVhNjBjXFx1YTYxMC1cXHVhNjJiXFx1YTY0MC1cXHVhNjZmXFx1YTY3NC1cXHVhNjdkXFx1YTY3Zi1cXHVhNjk3XFx1YTY5Zi1cXHVhNmYxXFx1YTcxNy1cXHVhNzFmXFx1YTcyMi1cXHVhNzg4XFx1YTc4Yi1cXHVhNzhlXFx1YTc5MC1cXHVhNzkzXFx1YTdhMC1cXHVhN2FhXFx1YTdmOC1cXHVhODI3XFx1YTg0MC1cXHVhODczXFx1YTg4MC1cXHVhOGM0XFx1YThkMC1cXHVhOGQ5XFx1YThlMC1cXHVhOGY3XFx1YThmYlxcdWE5MDAtXFx1YTkyZFxcdWE5MzAtXFx1YTk1M1xcdWE5NjAtXFx1YTk3Y1xcdWE5ODAtXFx1YTljMFxcdWE5Y2YtXFx1YTlkOVxcdWFhMDAtXFx1YWEzNlxcdWFhNDAtXFx1YWE0ZFxcdWFhNTAtXFx1YWE1OVxcdWFhNjAtXFx1YWE3NlxcdWFhN2FcXHVhYTdiXFx1YWE4MC1cXHVhYWMyXFx1YWFkYi1cXHVhYWRkXFx1YWFlMC1cXHVhYWVmXFx1YWFmMi1cXHVhYWY2XFx1YWIwMS1cXHVhYjA2XFx1YWIwOS1cXHVhYjBlXFx1YWIxMS1cXHVhYjE2XFx1YWIyMC1cXHVhYjI2XFx1YWIyOC1cXHVhYjJlXFx1YWJjMC1cXHVhYmVhXFx1YWJlY1xcdWFiZWRcXHVhYmYwLVxcdWFiZjlcXHVhYzAwLVxcdWQ3YTNcXHVkN2IwLVxcdWQ3YzZcXHVkN2NiLVxcdWQ3ZmJcXHVmOTAwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjAwLVxcdWZiMDZcXHVmYjEzLVxcdWZiMTdcXHVmYjFkLVxcdWZiMjhcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MFxcdWZiNDFcXHVmYjQzXFx1ZmI0NFxcdWZiNDYtXFx1ZmJiMVxcdWZiZDMtXFx1ZmQzZFxcdWZkNTAtXFx1ZmQ4ZlxcdWZkOTItXFx1ZmRjN1xcdWZkZjAtXFx1ZmRmYlxcdWZlMDAtXFx1ZmUwZlxcdWZlMjAtXFx1ZmUyNlxcdWZlMzNcXHVmZTM0XFx1ZmU0ZC1cXHVmZTRmXFx1ZmU3MC1cXHVmZTc0XFx1ZmU3Ni1cXHVmZWZjXFx1ZmYxMC1cXHVmZjE5XFx1ZmYyMS1cXHVmZjNhXFx1ZmYzZlxcdWZmNDEtXFx1ZmY1YVxcdWZmNjYtXFx1ZmZiZVxcdWZmYzItXFx1ZmZjN1xcdWZmY2EtXFx1ZmZjZlxcdWZmZDItXFx1ZmZkN1xcdWZmZGEtXFx1ZmZkY10nKVxuICAgIH07XG5cbiAgICAvLyBFbnN1cmUgdGhlIGNvbmRpdGlvbiBpcyB0cnVlLCBvdGhlcndpc2UgdGhyb3cgYW4gZXJyb3IuXG4gICAgLy8gVGhpcyBpcyBvbmx5IHRvIGhhdmUgYSBiZXR0ZXIgY29udHJhY3Qgc2VtYW50aWMsIGkuZS4gYW5vdGhlciBzYWZldHkgbmV0XG4gICAgLy8gdG8gY2F0Y2ggYSBsb2dpYyBlcnJvci4gVGhlIGNvbmRpdGlvbiBzaGFsbCBiZSBmdWxmaWxsZWQgaW4gbm9ybWFsIGNhc2UuXG4gICAgLy8gRG8gTk9UIHVzZSB0aGlzIHRvIGVuZm9yY2UgYSBjZXJ0YWluIGNvbmRpdGlvbiBvbiBhbnkgdXNlciBpbnB1dC5cblxuICAgIGZ1bmN0aW9uIGFzc2VydChjb25kaXRpb24sIG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQVNTRVJUOiAnICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzbGljZVNvdXJjZShmcm9tLCB0bykge1xuICAgICAgICByZXR1cm4gc291cmNlLnNsaWNlKGZyb20sIHRvKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mICdlc3ByaW1hJ1swXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2xpY2VTb3VyY2UgPSBmdW5jdGlvbiBzbGljZUFycmF5U291cmNlKGZyb20sIHRvKSB7XG4gICAgICAgICAgICByZXR1cm4gc291cmNlLnNsaWNlKGZyb20sIHRvKS5qb2luKCcnKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0RlY2ltYWxEaWdpdChjaCkge1xuICAgICAgICByZXR1cm4gJzAxMjM0NTY3ODknLmluZGV4T2YoY2gpID49IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNIZXhEaWdpdChjaCkge1xuICAgICAgICByZXR1cm4gJzAxMjM0NTY3ODlhYmNkZWZBQkNERUYnLmluZGV4T2YoY2gpID49IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNPY3RhbERpZ2l0KGNoKSB7XG4gICAgICAgIHJldHVybiAnMDEyMzQ1NjcnLmluZGV4T2YoY2gpID49IDA7XG4gICAgfVxuXG5cbiAgICAvLyA3LjIgV2hpdGUgU3BhY2VcblxuICAgIGZ1bmN0aW9uIGlzV2hpdGVTcGFjZShjaCkge1xuICAgICAgICByZXR1cm4gKGNoID09PSAnICcpIHx8IChjaCA9PT0gJ1xcdTAwMDknKSB8fCAoY2ggPT09ICdcXHUwMDBCJykgfHxcbiAgICAgICAgICAgIChjaCA9PT0gJ1xcdTAwMEMnKSB8fCAoY2ggPT09ICdcXHUwMEEwJykgfHxcbiAgICAgICAgICAgIChjaC5jaGFyQ29kZUF0KDApID49IDB4MTY4MCAmJlxuICAgICAgICAgICAgICdcXHUxNjgwXFx1MTgwRVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBBXFx1MjAyRlxcdTIwNUZcXHUzMDAwXFx1RkVGRicuaW5kZXhPZihjaCkgPj0gMCk7XG4gICAgfVxuXG4gICAgLy8gNy4zIExpbmUgVGVybWluYXRvcnNcblxuICAgIGZ1bmN0aW9uIGlzTGluZVRlcm1pbmF0b3IoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA9PT0gJ1xcbicgfHwgY2ggPT09ICdcXHInIHx8IGNoID09PSAnXFx1MjAyOCcgfHwgY2ggPT09ICdcXHUyMDI5Jyk7XG4gICAgfVxuXG4gICAgLy8gNy42IElkZW50aWZpZXIgTmFtZXMgYW5kIElkZW50aWZpZXJzXG5cbiAgICBmdW5jdGlvbiBpc0lkZW50aWZpZXJTdGFydChjaCkge1xuICAgICAgICByZXR1cm4gKGNoID09PSAnJCcpIHx8IChjaCA9PT0gJ18nKSB8fCAoY2ggPT09ICdcXFxcJykgfHxcbiAgICAgICAgICAgIChjaCA+PSAnYScgJiYgY2ggPD0gJ3onKSB8fCAoY2ggPj0gJ0EnICYmIGNoIDw9ICdaJykgfHxcbiAgICAgICAgICAgICgoY2guY2hhckNvZGVBdCgwKSA+PSAweDgwKSAmJiBSZWdleC5Ob25Bc2NpaUlkZW50aWZpZXJTdGFydC50ZXN0KGNoKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNJZGVudGlmaWVyUGFydChjaCkge1xuICAgICAgICByZXR1cm4gKGNoID09PSAnJCcpIHx8IChjaCA9PT0gJ18nKSB8fCAoY2ggPT09ICdcXFxcJykgfHxcbiAgICAgICAgICAgIChjaCA+PSAnYScgJiYgY2ggPD0gJ3onKSB8fCAoY2ggPj0gJ0EnICYmIGNoIDw9ICdaJykgfHxcbiAgICAgICAgICAgICgoY2ggPj0gJzAnKSAmJiAoY2ggPD0gJzknKSkgfHxcbiAgICAgICAgICAgICgoY2guY2hhckNvZGVBdCgwKSA+PSAweDgwKSAmJiBSZWdleC5Ob25Bc2NpaUlkZW50aWZpZXJQYXJ0LnRlc3QoY2gpKTtcbiAgICB9XG5cbiAgICAvLyA3LjYuMS4yIEZ1dHVyZSBSZXNlcnZlZCBXb3Jkc1xuXG4gICAgZnVuY3Rpb24gaXNGdXR1cmVSZXNlcnZlZFdvcmQoaWQpIHtcbiAgICAgICAgc3dpdGNoIChpZCkge1xuXG4gICAgICAgIC8vIEZ1dHVyZSByZXNlcnZlZCB3b3Jkcy5cbiAgICAgICAgY2FzZSAnY2xhc3MnOlxuICAgICAgICBjYXNlICdlbnVtJzpcbiAgICAgICAgY2FzZSAnZXhwb3J0JzpcbiAgICAgICAgY2FzZSAnZXh0ZW5kcyc6XG4gICAgICAgIGNhc2UgJ2ltcG9ydCc6XG4gICAgICAgIGNhc2UgJ3N1cGVyJzpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZChpZCkge1xuICAgICAgICBzd2l0Y2ggKGlkKSB7XG5cbiAgICAgICAgLy8gU3RyaWN0IE1vZGUgcmVzZXJ2ZWQgd29yZHMuXG4gICAgICAgIGNhc2UgJ2ltcGxlbWVudHMnOlxuICAgICAgICBjYXNlICdpbnRlcmZhY2UnOlxuICAgICAgICBjYXNlICdwYWNrYWdlJzpcbiAgICAgICAgY2FzZSAncHJpdmF0ZSc6XG4gICAgICAgIGNhc2UgJ3Byb3RlY3RlZCc6XG4gICAgICAgIGNhc2UgJ3B1YmxpYyc6XG4gICAgICAgIGNhc2UgJ3N0YXRpYyc6XG4gICAgICAgIGNhc2UgJ3lpZWxkJzpcbiAgICAgICAgY2FzZSAnbGV0JzpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUmVzdHJpY3RlZFdvcmQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGlkID09PSAnZXZhbCcgfHwgaWQgPT09ICdhcmd1bWVudHMnO1xuICAgIH1cblxuICAgIC8vIDcuNi4xLjEgS2V5d29yZHNcblxuICAgIGZ1bmN0aW9uIGlzS2V5d29yZChpZCkge1xuICAgICAgICB2YXIga2V5d29yZCA9IGZhbHNlO1xuICAgICAgICBzd2l0Y2ggKGlkLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBrZXl3b3JkID0gKGlkID09PSAnaWYnKSB8fCAoaWQgPT09ICdpbicpIHx8IChpZCA9PT0gJ2RvJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAga2V5d29yZCA9IChpZCA9PT0gJ3ZhcicpIHx8IChpZCA9PT0gJ2ZvcicpIHx8IChpZCA9PT0gJ25ldycpIHx8IChpZCA9PT0gJ3RyeScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIGtleXdvcmQgPSAoaWQgPT09ICd0aGlzJykgfHwgKGlkID09PSAnZWxzZScpIHx8IChpZCA9PT0gJ2Nhc2UnKSB8fCAoaWQgPT09ICd2b2lkJykgfHwgKGlkID09PSAnd2l0aCcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgIGtleXdvcmQgPSAoaWQgPT09ICd3aGlsZScpIHx8IChpZCA9PT0gJ2JyZWFrJykgfHwgKGlkID09PSAnY2F0Y2gnKSB8fCAoaWQgPT09ICd0aHJvdycpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgIGtleXdvcmQgPSAoaWQgPT09ICdyZXR1cm4nKSB8fCAoaWQgPT09ICd0eXBlb2YnKSB8fCAoaWQgPT09ICdkZWxldGUnKSB8fCAoaWQgPT09ICdzd2l0Y2gnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICBrZXl3b3JkID0gKGlkID09PSAnZGVmYXVsdCcpIHx8IChpZCA9PT0gJ2ZpbmFsbHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICBrZXl3b3JkID0gKGlkID09PSAnZnVuY3Rpb24nKSB8fCAoaWQgPT09ICdjb250aW51ZScpIHx8IChpZCA9PT0gJ2RlYnVnZ2VyJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICAgIGtleXdvcmQgPSAoaWQgPT09ICdpbnN0YW5jZW9mJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXl3b3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoaWQpIHtcbiAgICAgICAgLy8gRnV0dXJlIHJlc2VydmVkIHdvcmRzLlxuICAgICAgICAvLyAnY29uc3QnIGlzIHNwZWNpYWxpemVkIGFzIEtleXdvcmQgaW4gVjguXG4gICAgICAgIGNhc2UgJ2NvbnN0JzpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIC8vIEZvciBjb21wYXRpYmxpdHkgdG8gU3BpZGVyTW9ua2V5IGFuZCBFUy5uZXh0XG4gICAgICAgIGNhc2UgJ3lpZWxkJzpcbiAgICAgICAgY2FzZSAnbGV0JzpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0cmljdCAmJiBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc0Z1dHVyZVJlc2VydmVkV29yZChpZCk7XG4gICAgfVxuXG4gICAgLy8gNy40IENvbW1lbnRzXG5cbiAgICBmdW5jdGlvbiBza2lwQ29tbWVudCgpIHtcbiAgICAgICAgdmFyIGNoLCBibG9ja0NvbW1lbnQsIGxpbmVDb21tZW50O1xuXG4gICAgICAgIGJsb2NrQ29tbWVudCA9IGZhbHNlO1xuICAgICAgICBsaW5lQ29tbWVudCA9IGZhbHNlO1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuXG4gICAgICAgICAgICBpZiAobGluZUNvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZUNvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAnXFxyJyAmJiBzb3VyY2VbaW5kZXhdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICArK2xpbmVOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYmxvY2tDb21tZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ1xccicgJiYgc291cmNlW2luZGV4ICsgMV0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICsrbGluZU51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja0NvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4ICsgMV07XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgbGluZUNvbW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcqJykge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xuICAgICAgICAgICAgICAgICAgICBibG9ja0NvbW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzV2hpdGVTcGFjZShjaCkpIHtcbiAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAgJ1xccicgJiYgc291cmNlW2luZGV4XSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjYW5IZXhFc2NhcGUocHJlZml4KSB7XG4gICAgICAgIHZhciBpLCBsZW4sIGNoLCBjb2RlID0gMDtcblxuICAgICAgICBsZW4gPSAocHJlZml4ID09PSAndScpID8gNCA6IDI7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgaWYgKGluZGV4IDwgbGVuZ3RoICYmIGlzSGV4RGlnaXQoc291cmNlW2luZGV4XSkpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICBjb2RlID0gY29kZSAqIDE2ICsgJzAxMjM0NTY3ODlhYmNkZWYnLmluZGV4T2YoY2gudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FuSWRlbnRpZmllcigpIHtcbiAgICAgICAgdmFyIGNoLCBzdGFydCwgaWQsIHJlc3RvcmU7XG5cbiAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICBpZiAoIWlzSWRlbnRpZmllclN0YXJ0KGNoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgICAgaWYgKGNoID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICBpZiAoc291cmNlW2luZGV4XSAhPT0gJ3UnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgIHJlc3RvcmUgPSBpbmRleDtcbiAgICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgICAgaWYgKGNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAnXFxcXCcgfHwgIWlzSWRlbnRpZmllclN0YXJ0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkID0gY2g7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gcmVzdG9yZTtcbiAgICAgICAgICAgICAgICBpZCA9ICd1JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlkID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2ggPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZVtpbmRleF0gIT09ICd1Jykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgcmVzdG9yZSA9IGluZGV4O1xuICAgICAgICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgICAgICAgIGlmIChjaCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICdcXFxcJyB8fCAhaXNJZGVudGlmaWVyUGFydChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZCArPSBjaDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHJlc3RvcmU7XG4gICAgICAgICAgICAgICAgICAgIGlkICs9ICd1JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlkICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZXJlIGlzIG5vIGtleXdvcmQgb3IgbGl0ZXJhbCB3aXRoIG9ubHkgb25lIGNoYXJhY3Rlci5cbiAgICAgICAgLy8gVGh1cywgaXQgbXVzdCBiZSBhbiBpZGVudGlmaWVyLlxuICAgICAgICBpZiAoaWQubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlkLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzS2V5d29yZChpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uS2V5d29yZCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogaWQsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyA3LjguMSBOdWxsIExpdGVyYWxzXG5cbiAgICAgICAgaWYgKGlkID09PSAnbnVsbCcpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uTnVsbExpdGVyYWwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlkLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gNy44LjIgQm9vbGVhbiBMaXRlcmFsc1xuXG4gICAgICAgIGlmIChpZCA9PT0gJ3RydWUnIHx8IGlkID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLkJvb2xlYW5MaXRlcmFsLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpZCxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBUb2tlbi5JZGVudGlmaWVyLFxuICAgICAgICAgICAgdmFsdWU6IGlkLFxuICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gNy43IFB1bmN0dWF0b3JzXG5cbiAgICBmdW5jdGlvbiBzY2FuUHVuY3R1YXRvcigpIHtcbiAgICAgICAgdmFyIHN0YXJ0ID0gaW5kZXgsXG4gICAgICAgICAgICBjaDEgPSBzb3VyY2VbaW5kZXhdLFxuICAgICAgICAgICAgY2gyLFxuICAgICAgICAgICAgY2gzLFxuICAgICAgICAgICAgY2g0O1xuXG4gICAgICAgIC8vIENoZWNrIGZvciBtb3N0IGNvbW1vbiBzaW5nbGUtY2hhcmFjdGVyIHB1bmN0dWF0b3JzLlxuXG4gICAgICAgIGlmIChjaDEgPT09ICc7JyB8fCBjaDEgPT09ICd7JyB8fCBjaDEgPT09ICd9Jykge1xuICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogY2gxLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoMSA9PT0gJywnIHx8IGNoMSA9PT0gJygnIHx8IGNoMSA9PT0gJyknKSB7XG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBjaDEsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEb3QgKC4pIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9pbnQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgICAvLyB0byBjaGVjayB0aGUgbmV4dCBjaGFyYWN0ZXIuXG5cbiAgICAgICAgY2gyID0gc291cmNlW2luZGV4ICsgMV07XG4gICAgICAgIGlmIChjaDEgPT09ICcuJyAmJiAhaXNEZWNpbWFsRGlnaXQoY2gyKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBzb3VyY2VbaW5kZXgrK10sXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQZWVrIG1vcmUgY2hhcmFjdGVycy5cblxuICAgICAgICBjaDMgPSBzb3VyY2VbaW5kZXggKyAyXTtcbiAgICAgICAgY2g0ID0gc291cmNlW2luZGV4ICsgM107XG5cbiAgICAgICAgLy8gNC1jaGFyYWN0ZXIgcHVuY3R1YXRvcjogPj4+PVxuXG4gICAgICAgIGlmIChjaDEgPT09ICc+JyAmJiBjaDIgPT09ICc+JyAmJiBjaDMgPT09ICc+Jykge1xuICAgICAgICAgICAgaWYgKGNoNCA9PT0gJz0nKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggKz0gNDtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJz4+Pj0nLFxuICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDMtY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiA9PT0gIT09ID4+PiA8PD0gPj49XG5cbiAgICAgICAgaWYgKGNoMSA9PT0gJz0nICYmIGNoMiA9PT0gJz0nICYmIGNoMyA9PT0gJz0nKSB7XG4gICAgICAgICAgICBpbmRleCArPSAzO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnPT09JyxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaDEgPT09ICchJyAmJiBjaDIgPT09ICc9JyAmJiBjaDMgPT09ICc9Jykge1xuICAgICAgICAgICAgaW5kZXggKz0gMztcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogJyE9PScsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2gxID09PSAnPicgJiYgY2gyID09PSAnPicgJiYgY2gzID09PSAnPicpIHtcbiAgICAgICAgICAgIGluZGV4ICs9IDM7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICc+Pj4nLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoMSA9PT0gJzwnICYmIGNoMiA9PT0gJzwnICYmIGNoMyA9PT0gJz0nKSB7XG4gICAgICAgICAgICBpbmRleCArPSAzO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnPDw9JyxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaDEgPT09ICc+JyAmJiBjaDIgPT09ICc+JyAmJiBjaDMgPT09ICc9Jykge1xuICAgICAgICAgICAgaW5kZXggKz0gMztcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogJz4+PScsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLWNoYXJhY3RlciBwdW5jdHVhdG9yczogPD0gPj0gPT0gIT0gKysgLS0gPDwgPj4gJiYgfHxcbiAgICAgICAgLy8gKz0gLT0gKj0gJT0gJj0gfD0gXj0gLz1cblxuICAgICAgICBpZiAoY2gyID09PSAnPScpIHtcbiAgICAgICAgICAgIGlmICgnPD49ISstKiUmfF4vJy5pbmRleE9mKGNoMSkgPj0gMCkge1xuICAgICAgICAgICAgICAgIGluZGV4ICs9IDI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNoMSArIGNoMixcbiAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2gxID09PSBjaDIgJiYgKCcrLTw+JnwnLmluZGV4T2YoY2gxKSA+PSAwKSkge1xuICAgICAgICAgICAgaWYgKCcrLTw+JnwnLmluZGV4T2YoY2gyKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggKz0gMjtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY2gxICsgY2gyLFxuICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSByZW1haW5pbmcgMS1jaGFyYWN0ZXIgcHVuY3R1YXRvcnMuXG5cbiAgICAgICAgaWYgKCdbXTw+Ky0qJSZ8XiF+Pzo9LycuaW5kZXhPZihjaDEpID49IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogc291cmNlW2luZGV4KytdLFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtzdGFydCwgaW5kZXhdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gNy44LjMgTnVtZXJpYyBMaXRlcmFsc1xuXG4gICAgZnVuY3Rpb24gc2Nhbk51bWVyaWNMaXRlcmFsKCkge1xuICAgICAgICB2YXIgbnVtYmVyLCBzdGFydCwgY2g7XG5cbiAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICBhc3NlcnQoaXNEZWNpbWFsRGlnaXQoY2gpIHx8IChjaCA9PT0gJy4nKSxcbiAgICAgICAgICAgICdOdW1lcmljIGxpdGVyYWwgbXVzdCBzdGFydCB3aXRoIGEgZGVjaW1hbCBkaWdpdCBvciBhIGRlY2ltYWwgcG9pbnQnKTtcblxuICAgICAgICBzdGFydCA9IGluZGV4O1xuICAgICAgICBudW1iZXIgPSAnJztcbiAgICAgICAgaWYgKGNoICE9PSAnLicpIHtcbiAgICAgICAgICAgIG51bWJlciA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcblxuICAgICAgICAgICAgLy8gSGV4IG51bWJlciBzdGFydHMgd2l0aCAnMHgnLlxuICAgICAgICAgICAgLy8gT2N0YWwgbnVtYmVyIHN0YXJ0cyB3aXRoICcwJy5cbiAgICAgICAgICAgIGlmIChudW1iZXIgPT09ICcwJykge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ3gnIHx8IGNoID09PSAnWCcpIHtcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzSGV4RGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bWJlci5sZW5ndGggPD0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSAweFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5OdW1lcmljTGl0ZXJhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZUludChudW1iZXIsIDE2KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNPY3RhbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNPY3RhbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoKSB8fCBpc0RlY2ltYWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLk51bWVyaWNMaXRlcmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHBhcnNlSW50KG51bWJlciwgOCksXG4gICAgICAgICAgICAgICAgICAgICAgICBvY3RhbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRlY2ltYWwgbnVtYmVyIHN0YXJ0cyB3aXRoICcwJyBzdWNoIGFzICcwOScgaXMgaWxsZWdhbC5cbiAgICAgICAgICAgICAgICBpZiAoaXNEZWNpbWFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRGVjaW1hbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaCA9PT0gJy4nKSB7XG4gICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmICghaXNEZWNpbWFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoID09PSAnZScgfHwgY2ggPT09ICdFJykge1xuICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcblxuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKGNoID09PSAnKycgfHwgY2ggPT09ICctJykge1xuICAgICAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChpc0RlY2ltYWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNEZWNpbWFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2ggPSAnY2hhcmFjdGVyICcgKyBjaDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoID0gJzxlbmQ+JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2gpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFRva2VuLk51bWVyaWNMaXRlcmFsLFxuICAgICAgICAgICAgdmFsdWU6IHBhcnNlRmxvYXQobnVtYmVyKSxcbiAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDcuOC40IFN0cmluZyBMaXRlcmFsc1xuXG4gICAgZnVuY3Rpb24gc2NhblN0cmluZ0xpdGVyYWwoKSB7XG4gICAgICAgIHZhciBzdHIgPSAnJywgcXVvdGUsIHN0YXJ0LCBjaCwgY29kZSwgdW5lc2NhcGVkLCByZXN0b3JlLCBvY3RhbCA9IGZhbHNlO1xuXG4gICAgICAgIHF1b3RlID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgYXNzZXJ0KChxdW90ZSA9PT0gJ1xcJycgfHwgcXVvdGUgPT09ICdcIicpLFxuICAgICAgICAgICAgJ1N0cmluZyBsaXRlcmFsIG11c3Qgc3RhcnRzIHdpdGggYSBxdW90ZScpO1xuXG4gICAgICAgIHN0YXJ0ID0gaW5kZXg7XG4gICAgICAgICsraW5kZXg7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcblxuICAgICAgICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICAgICAgICAgIHF1b3RlID0gJyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzTGluZVRlcm1pbmF0b3IoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xccic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcdCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndSc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZSA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5lc2NhcGVkID0gc2NhbkhleEVzY2FwZShjaCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5lc2NhcGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IHVuZXNjYXBlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSByZXN0b3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxiJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdmJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxmJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd2JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFx4MEInO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc09jdGFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9ICcwMTIzNDU2NycuaW5kZXhPZihjaCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcXDAgaXMgbm90IG9jdGFsIGVzY2FwZSBzZXF1ZW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2RlICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCBsZW5ndGggJiYgaXNPY3RhbERpZ2l0KHNvdXJjZVtpbmRleF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiA4ICsgJzAxMjM0NTY3Jy5pbmRleE9mKHNvdXJjZVtpbmRleCsrXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMyBkaWdpdHMgYXJlIG9ubHkgYWxsb3dlZCB3aGVuIHN0cmluZyBzdGFydHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2l0aCAwLCAxLCAyLCAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnMDEyMycuaW5kZXhPZihjaCkgPj0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4IDwgbGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNPY3RhbERpZ2l0KHNvdXJjZVtpbmRleF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZSAqIDggKyAnMDEyMzQ1NjcnLmluZGV4T2Yoc291cmNlW2luZGV4KytdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICArK2xpbmVOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gICdcXHInICYmIHNvdXJjZVtpbmRleF0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocXVvdGUgIT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogVG9rZW4uU3RyaW5nTGl0ZXJhbCxcbiAgICAgICAgICAgIHZhbHVlOiBzdHIsXG4gICAgICAgICAgICBvY3RhbDogb2N0YWwsXG4gICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICByYW5nZTogW3N0YXJ0LCBpbmRleF1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FuUmVnRXhwKCkge1xuICAgICAgICB2YXIgc3RyLCBjaCwgc3RhcnQsIHBhdHRlcm4sIGZsYWdzLCB2YWx1ZSwgY2xhc3NNYXJrZXIgPSBmYWxzZSwgcmVzdG9yZSwgdGVybWluYXRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHNraXBDb21tZW50KCk7XG5cbiAgICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICBhc3NlcnQoY2ggPT09ICcvJywgJ1JlZ3VsYXIgZXhwcmVzc2lvbiBsaXRlcmFsIG11c3Qgc3RhcnQgd2l0aCBhIHNsYXNoJyk7XG4gICAgICAgIHN0ciA9IHNvdXJjZVtpbmRleCsrXTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgaWYgKGNoID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAvLyBFQ01BLTI2MiA3LjguNVxuICAgICAgICAgICAgICAgIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbnRlcm1pbmF0ZWRSZWdFeHApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTWFya2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAnXScpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NNYXJrZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlcm1pbmF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnWycpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NNYXJrZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW50ZXJtaW5hdGVkUmVnRXhwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRlcm1pbmF0ZWQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVudGVybWluYXRlZFJlZ0V4cCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeGNsdWRlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoLlxuICAgICAgICBwYXR0ZXJuID0gc3RyLnN1YnN0cigxLCBzdHIubGVuZ3RoIC0gMik7XG5cbiAgICAgICAgZmxhZ3MgPSAnJztcbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICBpZiAoY2ggPT09ICdcXFxcJyAmJiBpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICd1Jykge1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICByZXN0b3JlID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXFxcdSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKDsgcmVzdG9yZSA8IGluZGV4OyArK3Jlc3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gc291cmNlW3Jlc3RvcmVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSByZXN0b3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgKz0gJ3UnO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXFxcdSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcXFwnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmxhZ3MgKz0gY2g7XG4gICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhbHVlID0gbmV3IFJlZ0V4cChwYXR0ZXJuLCBmbGFncyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLkludmFsaWRSZWdFeHApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxpdGVyYWw6IHN0cixcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGluZGV4XVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzSWRlbnRpZmllck5hbWUodG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIgfHxcbiAgICAgICAgICAgIHRva2VuLnR5cGUgPT09IFRva2VuLktleXdvcmQgfHxcbiAgICAgICAgICAgIHRva2VuLnR5cGUgPT09IFRva2VuLkJvb2xlYW5MaXRlcmFsIHx8XG4gICAgICAgICAgICB0b2tlbi50eXBlID09PSBUb2tlbi5OdWxsTGl0ZXJhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZHZhbmNlKCkge1xuICAgICAgICB2YXIgY2gsIHRva2VuO1xuXG4gICAgICAgIHNraXBDb21tZW50KCk7XG5cbiAgICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5FT0YsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICByYW5nZTogW2luZGV4LCBpbmRleF1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0b2tlbiA9IHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgIH1cblxuICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG5cbiAgICAgICAgaWYgKGNoID09PSAnXFwnJyB8fCBjaCA9PT0gJ1wiJykge1xuICAgICAgICAgICAgcmV0dXJuIHNjYW5TdHJpbmdMaXRlcmFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2ggPT09ICcuJyB8fCBpc0RlY2ltYWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgIHJldHVybiBzY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRva2VuID0gc2NhbklkZW50aWZpZXIoKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsZXgoKSB7XG4gICAgICAgIHZhciB0b2tlbjtcblxuICAgICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgICAgICBpbmRleCA9IGJ1ZmZlci5yYW5nZVsxXTtcbiAgICAgICAgICAgIGxpbmVOdW1iZXIgPSBidWZmZXIubGluZU51bWJlcjtcbiAgICAgICAgICAgIGxpbmVTdGFydCA9IGJ1ZmZlci5saW5lU3RhcnQ7XG4gICAgICAgICAgICB0b2tlbiA9IGJ1ZmZlcjtcbiAgICAgICAgICAgIGJ1ZmZlciA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgIH1cblxuICAgICAgICBidWZmZXIgPSBudWxsO1xuICAgICAgICByZXR1cm4gYWR2YW5jZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvb2thaGVhZCgpIHtcbiAgICAgICAgdmFyIHBvcywgbGluZSwgc3RhcnQ7XG5cbiAgICAgICAgaWYgKGJ1ZmZlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBvcyA9IGluZGV4O1xuICAgICAgICBsaW5lID0gbGluZU51bWJlcjtcbiAgICAgICAgc3RhcnQgPSBsaW5lU3RhcnQ7XG4gICAgICAgIGJ1ZmZlciA9IGFkdmFuY2UoKTtcbiAgICAgICAgaW5kZXggPSBwb3M7XG4gICAgICAgIGxpbmVOdW1iZXIgPSBsaW5lO1xuICAgICAgICBsaW5lU3RhcnQgPSBzdGFydDtcblxuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0cnVlIGlmIHRoZXJlIGlzIGEgbGluZSB0ZXJtaW5hdG9yIGJlZm9yZSB0aGUgbmV4dCB0b2tlbi5cblxuICAgIGZ1bmN0aW9uIHBlZWtMaW5lVGVybWluYXRvcigpIHtcbiAgICAgICAgdmFyIHBvcywgbGluZSwgc3RhcnQsIGZvdW5kO1xuXG4gICAgICAgIHBvcyA9IGluZGV4O1xuICAgICAgICBsaW5lID0gbGluZU51bWJlcjtcbiAgICAgICAgc3RhcnQgPSBsaW5lU3RhcnQ7XG4gICAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICAgIGZvdW5kID0gbGluZU51bWJlciAhPT0gbGluZTtcbiAgICAgICAgaW5kZXggPSBwb3M7XG4gICAgICAgIGxpbmVOdW1iZXIgPSBsaW5lO1xuICAgICAgICBsaW5lU3RhcnQgPSBzdGFydDtcblxuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuXG4gICAgLy8gVGhyb3cgYW4gZXhjZXB0aW9uXG5cbiAgICBmdW5jdGlvbiB0aHJvd0Vycm9yKHRva2VuLCBtZXNzYWdlRm9ybWF0KSB7XG4gICAgICAgIHZhciBlcnJvcixcbiAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLFxuICAgICAgICAgICAgbXNnID0gbWVzc2FnZUZvcm1hdC5yZXBsYWNlKFxuICAgICAgICAgICAgICAgIC8lKFxcZCkvZyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAod2hvbGUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmdzW2luZGV4XSB8fCAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4ubGluZU51bWJlciA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKCdMaW5lICcgKyB0b2tlbi5saW5lTnVtYmVyICsgJzogJyArIG1zZyk7XG4gICAgICAgICAgICBlcnJvci5pbmRleCA9IHRva2VuLnJhbmdlWzBdO1xuICAgICAgICAgICAgZXJyb3IubGluZU51bWJlciA9IHRva2VuLmxpbmVOdW1iZXI7XG4gICAgICAgICAgICBlcnJvci5jb2x1bW4gPSB0b2tlbi5yYW5nZVswXSAtIGxpbmVTdGFydCArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcignTGluZSAnICsgbGluZU51bWJlciArICc6ICcgKyBtc2cpO1xuICAgICAgICAgICAgZXJyb3IuaW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGVycm9yLmxpbmVOdW1iZXIgPSBsaW5lTnVtYmVyO1xuICAgICAgICAgICAgZXJyb3IuY29sdW1uID0gaW5kZXggLSBsaW5lU3RhcnQgKyAxO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGhyb3dFcnJvclRvbGVyYW50KCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3dFcnJvci5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZXh0cmEuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgZXh0cmEuZXJyb3JzLnB1c2goZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8vIFRocm93IGFuIGV4Y2VwdGlvbiBiZWNhdXNlIG9mIHRoZSB0b2tlbi5cblxuICAgIGZ1bmN0aW9uIHRocm93VW5leHBlY3RlZCh0b2tlbikge1xuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkRU9TKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5OdW1lcmljTGl0ZXJhbCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZE51bWJlcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFN0cmluZyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uSWRlbnRpZmllcikge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZElkZW50aWZpZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLktleXdvcmQpIHtcbiAgICAgICAgICAgIGlmIChpc0Z1dHVyZVJlc2VydmVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkUmVzZXJ2ZWQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuU3RyaWN0UmVzZXJ2ZWRXb3JkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sIHRva2VuLnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJvb2xlYW5MaXRlcmFsLCBOdWxsTGl0ZXJhbCwgb3IgUHVuY3R1YXRvci5cbiAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCB0b2tlbi52YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gRXhwZWN0IHRoZSBuZXh0IHRva2VuIHRvIG1hdGNoIHRoZSBzcGVjaWZpZWQgcHVuY3R1YXRvci5cbiAgICAvLyBJZiBub3QsIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cblxuICAgIGZ1bmN0aW9uIGV4cGVjdCh2YWx1ZSkge1xuICAgICAgICB2YXIgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlB1bmN0dWF0b3IgfHwgdG9rZW4udmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRXhwZWN0IHRoZSBuZXh0IHRva2VuIHRvIG1hdGNoIHRoZSBzcGVjaWZpZWQga2V5d29yZC5cbiAgICAvLyBJZiBub3QsIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cblxuICAgIGZ1bmN0aW9uIGV4cGVjdEtleXdvcmQoa2V5d29yZCkge1xuICAgICAgICB2YXIgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLktleXdvcmQgfHwgdG9rZW4udmFsdWUgIT09IGtleXdvcmQpIHtcbiAgICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgbmV4dCB0b2tlbiBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgcHVuY3R1YXRvci5cblxuICAgIGZ1bmN0aW9uIG1hdGNoKHZhbHVlKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICByZXR1cm4gdG9rZW4udHlwZSA9PT0gVG9rZW4uUHVuY3R1YXRvciAmJiB0b2tlbi52YWx1ZSA9PT0gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgdGhlIG5leHQgdG9rZW4gbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIGtleXdvcmRcblxuICAgIGZ1bmN0aW9uIG1hdGNoS2V5d29yZChrZXl3b3JkKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICByZXR1cm4gdG9rZW4udHlwZSA9PT0gVG9rZW4uS2V5d29yZCAmJiB0b2tlbi52YWx1ZSA9PT0ga2V5d29yZDtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgbmV4dCB0b2tlbiBpcyBhbiBhc3NpZ25tZW50IG9wZXJhdG9yXG5cbiAgICBmdW5jdGlvbiBtYXRjaEFzc2lnbigpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbG9va2FoZWFkKCksXG4gICAgICAgICAgICBvcCA9IHRva2VuLnZhbHVlO1xuXG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9wID09PSAnPScgfHxcbiAgICAgICAgICAgIG9wID09PSAnKj0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJy89JyB8fFxuICAgICAgICAgICAgb3AgPT09ICclPScgfHxcbiAgICAgICAgICAgIG9wID09PSAnKz0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJy09JyB8fFxuICAgICAgICAgICAgb3AgPT09ICc8PD0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJz4+PScgfHxcbiAgICAgICAgICAgIG9wID09PSAnPj4+PScgfHxcbiAgICAgICAgICAgIG9wID09PSAnJj0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJ149JyB8fFxuICAgICAgICAgICAgb3AgPT09ICd8PSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICAgICAgdmFyIHRva2VuLCBsaW5lO1xuXG4gICAgICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0LlxuICAgICAgICBpZiAoc291cmNlW2luZGV4XSA9PT0gJzsnKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgICBpZiAobGluZU51bWJlciAhPT0gbGluZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoKCc7JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLkVPRiAmJiAhbWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJldHVybiB0cnVlIGlmIHByb3ZpZGVkIGV4cHJlc3Npb24gaXMgTGVmdEhhbmRTaWRlRXhwcmVzc2lvblxuXG4gICAgZnVuY3Rpb24gaXNMZWZ0SGFuZFNpZGUoZXhwcikge1xuICAgICAgICByZXR1cm4gZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllciB8fCBleHByLnR5cGUgPT09IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uO1xuICAgIH1cblxuICAgIC8vIDExLjEuNCBBcnJheSBJbml0aWFsaXNlclxuXG4gICAgZnVuY3Rpb24gcGFyc2VBcnJheUluaXRpYWxpc2VyKCkge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBbXTtcblxuICAgICAgICBleHBlY3QoJ1snKTtcblxuICAgICAgICB3aGlsZSAoIW1hdGNoKCddJykpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChudWxsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaCgnXScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdCgnLCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cGVjdCgnXScpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguQXJyYXlFeHByZXNzaW9uLFxuICAgICAgICAgICAgZWxlbWVudHM6IGVsZW1lbnRzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTEuMS41IE9iamVjdCBJbml0aWFsaXNlclxuXG4gICAgZnVuY3Rpb24gcGFyc2VQcm9wZXJ0eUZ1bmN0aW9uKHBhcmFtLCBmaXJzdCkge1xuICAgICAgICB2YXIgcHJldmlvdXNTdHJpY3QsIGJvZHk7XG5cbiAgICAgICAgcHJldmlvdXNTdHJpY3QgPSBzdHJpY3Q7XG4gICAgICAgIGJvZHkgPSBwYXJzZUZ1bmN0aW9uU291cmNlRWxlbWVudHMoKTtcbiAgICAgICAgaWYgKGZpcnN0ICYmIHN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhcmFtWzBdLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoZmlyc3QsIE1lc3NhZ2VzLlN0cmljdFBhcmFtTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5GdW5jdGlvbkV4cHJlc3Npb24sXG4gICAgICAgICAgICBpZDogbnVsbCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW0sXG4gICAgICAgICAgICBkZWZhdWx0czogW10sXG4gICAgICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICAgICAgcmVzdDogbnVsbCxcbiAgICAgICAgICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgICAgICAgICBleHByZXNzaW9uOiBmYWxzZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxleCgpO1xuXG4gICAgICAgIC8vIE5vdGU6IFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIG9ubHkgZnJvbSBwYXJzZU9iamVjdFByb3BlcnR5KCksIHdoZXJlXG4gICAgICAgIC8vIEVPRiBhbmQgUHVuY3R1YXRvciB0b2tlbnMgYXJlIGFscmVhZHkgZmlsdGVyZWQgb3V0LlxuXG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5TdHJpbmdMaXRlcmFsIHx8IHRva2VuLnR5cGUgPT09IFRva2VuLk51bWVyaWNMaXRlcmFsKSB7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUxpdGVyYWwodG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5JZGVudGlmaWVyLFxuICAgICAgICAgICAgbmFtZTogdG9rZW4udmFsdWVcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZU9iamVjdFByb3BlcnR5KCkge1xuICAgICAgICB2YXIgdG9rZW4sIGtleSwgaWQsIHBhcmFtO1xuXG4gICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcblxuICAgICAgICAgICAgaWQgPSBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG5cbiAgICAgICAgICAgIC8vIFByb3BlcnR5IEFzc2lnbm1lbnQ6IEdldHRlciBhbmQgU2V0dGVyLlxuXG4gICAgICAgICAgICBpZiAodG9rZW4udmFsdWUgPT09ICdnZXQnICYmICFtYXRjaCgnOicpKSB7XG4gICAgICAgICAgICAgICAga2V5ID0gcGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdCgnKCcpO1xuICAgICAgICAgICAgICAgIGV4cGVjdCgnKScpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Qcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZVByb3BlcnR5RnVuY3Rpb24oW10pLFxuICAgICAgICAgICAgICAgICAgICBraW5kOiAnZ2V0J1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRva2VuLnZhbHVlID09PSAnc2V0JyAmJiAhbWF0Y2goJzonKSkge1xuICAgICAgICAgICAgICAgIGtleSA9IHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoJygnKTtcbiAgICAgICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICAgICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdCgnKScpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgdG9rZW4udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcGFyc2VQcm9wZXJ0eUZ1bmN0aW9uKFtdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6ICdzZXQnXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW0gPSBbIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCkgXTtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KCcpJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguUHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZVByb3BlcnR5RnVuY3Rpb24ocGFyYW0sIHRva2VuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6ICdzZXQnXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleHBlY3QoJzonKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguUHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgIGtleTogaWQsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCksXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6ICdpbml0J1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uRU9GIHx8IHRva2VuLnR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXkgPSBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgICAgICAgICBleHBlY3QoJzonKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlByb3BlcnR5LFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCksXG4gICAgICAgICAgICAgICAga2luZDogJ2luaXQnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VPYmplY3RJbml0aWFsaXNlcigpIHtcbiAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBbXSwgcHJvcGVydHksIG5hbWUsIGtpbmQsIG1hcCA9IHt9LCB0b1N0cmluZyA9IFN0cmluZztcblxuICAgICAgICBleHBlY3QoJ3snKTtcblxuICAgICAgICB3aGlsZSAoIW1hdGNoKCd9JykpIHtcbiAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VPYmplY3RQcm9wZXJ0eSgpO1xuXG4gICAgICAgICAgICBpZiAocHJvcGVydHkua2V5LnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IHByb3BlcnR5LmtleS5uYW1lO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gdG9TdHJpbmcocHJvcGVydHkua2V5LnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtpbmQgPSAocHJvcGVydHkua2luZCA9PT0gJ2luaXQnKSA/IFByb3BlcnR5S2luZC5EYXRhIDogKHByb3BlcnR5LmtpbmQgPT09ICdnZXQnKSA/IFByb3BlcnR5S2luZC5HZXQgOiBQcm9wZXJ0eUtpbmQuU2V0O1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtYXAsIG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcFtuYW1lXSA9PT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBraW5kID09PSBQcm9wZXJ0eUtpbmQuRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3REdXBsaWNhdGVQcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2luZCAhPT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuQWNjZXNzb3JEYXRhUHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtpbmQgPT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkFjY2Vzc29yRGF0YVByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXBbbmFtZV0gJiBraW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkFjY2Vzc29yR2V0U2V0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtYXBbbmFtZV0gfD0ga2luZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwW25hbWVdID0ga2luZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcblxuICAgICAgICAgICAgaWYgKCFtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KCcsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QoJ30nKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4Lk9iamVjdEV4cHJlc3Npb24sXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTEuMS42IFRoZSBHcm91cGluZyBPcGVyYXRvclxuXG4gICAgZnVuY3Rpb24gcGFyc2VHcm91cEV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByO1xuXG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cblxuICAgIC8vIDExLjEgUHJpbWFyeSBFeHByZXNzaW9uc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbG9va2FoZWFkKCksXG4gICAgICAgICAgICB0eXBlID0gdG9rZW4udHlwZTtcblxuICAgICAgICBpZiAodHlwZSA9PT0gVG9rZW4uSWRlbnRpZmllcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICBuYW1lOiBsZXgoKS52YWx1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBUb2tlbi5TdHJpbmdMaXRlcmFsIHx8IHR5cGUgPT09IFRva2VuLk51bWVyaWNMaXRlcmFsKSB7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUxpdGVyYWwobGV4KCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IFRva2VuLktleXdvcmQpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ3RoaXMnKSkge1xuICAgICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5UaGlzRXhwcmVzc2lvblxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGdW5jdGlvbkV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBUb2tlbi5Cb29sZWFuTGl0ZXJhbCkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICB0b2tlbi52YWx1ZSA9ICh0b2tlbi52YWx1ZSA9PT0gJ3RydWUnKTtcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVMaXRlcmFsKHRva2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBUb2tlbi5OdWxsTGl0ZXJhbCkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICB0b2tlbi52YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlTGl0ZXJhbCh0b2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlQXJyYXlJbml0aWFsaXNlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoKCd7JykpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZU9iamVjdEluaXRpYWxpc2VyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlR3JvdXBFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2goJy8nKSB8fCBtYXRjaCgnLz0nKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUxpdGVyYWwoc2NhblJlZ0V4cCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aHJvd1VuZXhwZWN0ZWQobGV4KCkpO1xuICAgIH1cblxuICAgIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlQXJndW1lbnRzKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuXG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIGlmICghbWF0Y2goJyknKSkge1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKCcpJykpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV4cGVjdCgnLCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgcmV0dXJuIGFyZ3M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCkge1xuICAgICAgICB2YXIgdG9rZW4gPSBsZXgoKTtcblxuICAgICAgICBpZiAoIWlzSWRlbnRpZmllck5hbWUodG9rZW4pKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5JZGVudGlmaWVyLFxuICAgICAgICAgICAgbmFtZTogdG9rZW4udmFsdWVcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkge1xuICAgICAgICBleHBlY3QoJy4nKTtcblxuICAgICAgICByZXR1cm4gcGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VDb21wdXRlZE1lbWJlcigpIHtcbiAgICAgICAgdmFyIGV4cHI7XG5cbiAgICAgICAgZXhwZWN0KCdbJyk7XG5cbiAgICAgICAgZXhwciA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGV4cGVjdCgnXScpO1xuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlTmV3RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHI7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnbmV3Jyk7XG5cbiAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5OZXdFeHByZXNzaW9uLFxuICAgICAgICAgICAgY2FsbGVlOiBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKSxcbiAgICAgICAgICAgICdhcmd1bWVudHMnOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChtYXRjaCgnKCcpKSB7XG4gICAgICAgICAgICBleHByWydhcmd1bWVudHMnXSA9IHBhcnNlQXJndW1lbnRzKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKSB7XG4gICAgICAgIHZhciBleHByO1xuXG4gICAgICAgIGV4cHIgPSBtYXRjaEtleXdvcmQoJ25ldycpID8gcGFyc2VOZXdFeHByZXNzaW9uKCkgOiBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoKCcuJykgfHwgbWF0Y2goJ1snKSB8fCBtYXRjaCgnKCcpKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5DYWxsRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgY2FsbGVlOiBleHByLFxuICAgICAgICAgICAgICAgICAgICAnYXJndW1lbnRzJzogcGFyc2VBcmd1bWVudHMoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoKCdbJykpIHtcbiAgICAgICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTWVtYmVyRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHBhcnNlQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHI7XG5cbiAgICAgICAgZXhwciA9IG1hdGNoS2V5d29yZCgnbmV3JykgPyBwYXJzZU5ld0V4cHJlc3Npb24oKSA6IHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJy4nKSB8fCBtYXRjaCgnWycpKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICBjb21wdXRlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBleHByLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcGFyc2VDb21wdXRlZE1lbWJlcigpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4Lk1lbWJlckV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBleHByLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcGFyc2VOb25Db21wdXRlZE1lbWJlcigpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIC8vIDExLjMgUG9zdGZpeCBFeHByZXNzaW9uc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKSwgdG9rZW47XG5cbiAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBleHByO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKChtYXRjaCgnKysnKSB8fCBtYXRjaCgnLS0nKSkgJiYgIXBlZWtMaW5lVGVybWluYXRvcigpKSB7XG4gICAgICAgICAgICAvLyAxMS4zLjEsIDExLjMuMlxuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBleHByLnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuU3RyaWN0TEhTUG9zdGZpeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzTGVmdEhhbmRTaWRlKGV4cHIpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5JbnZhbGlkTEhTSW5Bc3NpZ25tZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguVXBkYXRlRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogbGV4KCkudmFsdWUsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcHJlZml4OiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIC8vIDExLjQgVW5hcnkgT3BlcmF0b3JzXG5cbiAgICBmdW5jdGlvbiBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIHRva2VuLCBleHByO1xuXG4gICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yICYmIHRva2VuLnR5cGUgIT09IFRva2VuLktleXdvcmQpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2goJysrJykgfHwgbWF0Y2goJy0tJykpIHtcbiAgICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgICBleHByID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgIC8vIDExLjQuNCwgMTEuNC41XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGV4cHIudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3RMSFNQcmVmaXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzTGVmdEhhbmRTaWRlKGV4cHIpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5JbnZhbGlkTEhTSW5Bc3NpZ25tZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguVXBkYXRlRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogdG9rZW4udmFsdWUsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcHJlZml4OiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2goJysnKSB8fCBtYXRjaCgnLScpIHx8IG1hdGNoKCd+JykgfHwgbWF0Y2goJyEnKSkge1xuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguVW5hcnlFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBsZXgoKS52YWx1ZSxcbiAgICAgICAgICAgICAgICBhcmd1bWVudDogcGFyc2VVbmFyeUV4cHJlc3Npb24oKSxcbiAgICAgICAgICAgICAgICBwcmVmaXg6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gZXhwcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ2RlbGV0ZScpIHx8IG1hdGNoS2V5d29yZCgndm9pZCcpIHx8IG1hdGNoS2V5d29yZCgndHlwZW9mJykpIHtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlVuYXJ5RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogbGV4KCkudmFsdWUsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQ6IHBhcnNlVW5hcnlFeHByZXNzaW9uKCksXG4gICAgICAgICAgICAgICAgcHJlZml4OiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBleHByLm9wZXJhdG9yID09PSAnZGVsZXRlJyAmJiBleHByLmFyZ3VtZW50LnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3REZWxldGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cblxuICAgIC8vIDExLjUgTXVsdGlwbGljYXRpdmUgT3BlcmF0b3JzXG5cbiAgICBmdW5jdGlvbiBwYXJzZU11bHRpcGxpY2F0aXZlRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnKicpIHx8IG1hdGNoKCcvJykgfHwgbWF0Y2goJyUnKSkge1xuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQmluYXJ5RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogbGV4KCkudmFsdWUsXG4gICAgICAgICAgICAgICAgbGVmdDogZXhwcixcbiAgICAgICAgICAgICAgICByaWdodDogcGFyc2VVbmFyeUV4cHJlc3Npb24oKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIC8vIDExLjYgQWRkaXRpdmUgT3BlcmF0b3JzXG5cbiAgICBmdW5jdGlvbiBwYXJzZUFkZGl0aXZlRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZU11bHRpcGxpY2F0aXZlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnKycpIHx8IG1hdGNoKCctJykpIHtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJpbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGxleCgpLnZhbHVlLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBhcnNlTXVsdGlwbGljYXRpdmVFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS43IEJpdHdpc2UgU2hpZnQgT3BlcmF0b3JzXG5cbiAgICBmdW5jdGlvbiBwYXJzZVNoaWZ0RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZUFkZGl0aXZlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnPDwnKSB8fCBtYXRjaCgnPj4nKSB8fCBtYXRjaCgnPj4+JykpIHtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJpbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGxleCgpLnZhbHVlLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBhcnNlQWRkaXRpdmVFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG4gICAgLy8gMTEuOCBSZWxhdGlvbmFsIE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VSZWxhdGlvbmFsRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIsIHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBwcmV2aW91c0FsbG93SW4gPSBzdGF0ZS5hbGxvd0luO1xuICAgICAgICBzdGF0ZS5hbGxvd0luID0gdHJ1ZTtcblxuICAgICAgICBleHByID0gcGFyc2VTaGlmdEV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJzwnKSB8fCBtYXRjaCgnPicpIHx8IG1hdGNoKCc8PScpIHx8IG1hdGNoKCc+PScpIHx8IChwcmV2aW91c0FsbG93SW4gJiYgbWF0Y2hLZXl3b3JkKCdpbicpKSB8fCBtYXRjaEtleXdvcmQoJ2luc3RhbmNlb2YnKSkge1xuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQmluYXJ5RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogbGV4KCkudmFsdWUsXG4gICAgICAgICAgICAgICAgbGVmdDogZXhwcixcbiAgICAgICAgICAgICAgICByaWdodDogcGFyc2VTaGlmdEV4cHJlc3Npb24oKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIC8vIDExLjkgRXF1YWxpdHkgT3BlcmF0b3JzXG5cbiAgICBmdW5jdGlvbiBwYXJzZUVxdWFsaXR5RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZVJlbGF0aW9uYWxFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoKCc9PScpIHx8IG1hdGNoKCchPScpIHx8IG1hdGNoKCc9PT0nKSB8fCBtYXRjaCgnIT09JykpIHtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJpbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGxleCgpLnZhbHVlLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBhcnNlUmVsYXRpb25hbEV4cHJlc3Npb24oKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIC8vIDExLjEwIEJpbmFyeSBCaXR3aXNlIE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VCaXR3aXNlQU5ERXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZUVxdWFsaXR5RXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnJicpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJpbmFyeUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6ICcmJyxcbiAgICAgICAgICAgICAgICBsZWZ0OiBleHByLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYXJzZUVxdWFsaXR5RXhwcmVzc2lvbigpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VCaXR3aXNlWE9SRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZUJpdHdpc2VBTkRFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoKCdeJykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQmluYXJ5RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogJ14nLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBhcnNlQml0d2lzZUFOREV4cHJlc3Npb24oKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlQml0d2lzZU9SRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZUJpdHdpc2VYT1JFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgd2hpbGUgKG1hdGNoKCd8JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQmluYXJ5RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogJ3wnLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IHBhcnNlQml0d2lzZVhPUkV4cHJlc3Npb24oKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIC8vIDExLjExIEJpbmFyeSBMb2dpY2FsIE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VMb2dpY2FsQU5ERXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIgPSBwYXJzZUJpdHdpc2VPUkV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJyYmJykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTG9naWNhbEV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6ICcmJicsXG4gICAgICAgICAgICAgICAgbGVmdDogZXhwcixcbiAgICAgICAgICAgICAgICByaWdodDogcGFyc2VCaXR3aXNlT1JFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUxvZ2ljYWxPUkV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByID0gcGFyc2VMb2dpY2FsQU5ERXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnfHwnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Mb2dpY2FsRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogJ3x8JyxcbiAgICAgICAgICAgICAgICBsZWZ0OiBleHByLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYXJzZUxvZ2ljYWxBTkRFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS4xMiBDb25kaXRpb25hbCBPcGVyYXRvclxuXG4gICAgZnVuY3Rpb24gcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByLCBwcmV2aW91c0FsbG93SW4sIGNvbnNlcXVlbnQ7XG5cbiAgICAgICAgZXhwciA9IHBhcnNlTG9naWNhbE9SRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGlmIChtYXRjaCgnPycpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIHByZXZpb3VzQWxsb3dJbiA9IHN0YXRlLmFsbG93SW47XG4gICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnNlcXVlbnQgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgICAgICAgZXhwZWN0KCc6Jyk7XG5cbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkNvbmRpdGlvbmFsRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICB0ZXN0OiBleHByLFxuICAgICAgICAgICAgICAgIGNvbnNlcXVlbnQ6IGNvbnNlcXVlbnQsXG4gICAgICAgICAgICAgICAgYWx0ZXJuYXRlOiBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS4xMyBBc3NpZ25tZW50IE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIHRva2VuLCBleHByO1xuXG4gICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgIGV4cHIgPSBwYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGlmIChtYXRjaEFzc2lnbigpKSB7XG4gICAgICAgICAgICAvLyBMZWZ0SGFuZFNpZGVFeHByZXNzaW9uXG4gICAgICAgICAgICBpZiAoIWlzTGVmdEhhbmRTaWRlKGV4cHIpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5JbnZhbGlkTEhTSW5Bc3NpZ25tZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gMTEuMTMuMVxuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBleHByLnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuU3RyaWN0TEhTQXNzaWdubWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkFzc2lnbm1lbnRFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBsZXgoKS52YWx1ZSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBleHByLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS4xNCBDb21tYSBPcGVyYXRvclxuXG4gICAgZnVuY3Rpb24gcGFyc2VFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgZXhwciA9IHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcblxuICAgICAgICBpZiAobWF0Y2goJywnKSkge1xuICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguU2VxdWVuY2VFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zOiBbIGV4cHIgXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgICAgICBleHByLmV4cHJlc3Npb25zLnB1c2gocGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIC8vIDEyLjEgQmxvY2tcblxuICAgIGZ1bmN0aW9uIHBhcnNlU3RhdGVtZW50TGlzdCgpIHtcbiAgICAgICAgdmFyIGxpc3QgPSBbXSxcbiAgICAgICAgICAgIHN0YXRlbWVudDtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZW1lbnQgPSBwYXJzZVNvdXJjZUVsZW1lbnQoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGlzdC5wdXNoKHN0YXRlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUJsb2NrKCkge1xuICAgICAgICB2YXIgYmxvY2s7XG5cbiAgICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgICAgYmxvY2sgPSBwYXJzZVN0YXRlbWVudExpc3QoKTtcblxuICAgICAgICBleHBlY3QoJ30nKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkJsb2NrU3RhdGVtZW50LFxuICAgICAgICAgICAgYm9keTogYmxvY2tcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi4yIFZhcmlhYmxlIFN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxleCgpO1xuXG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5JZGVudGlmaWVyLFxuICAgICAgICAgICAgbmFtZTogdG9rZW4udmFsdWVcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oa2luZCkge1xuICAgICAgICB2YXIgaWQgPSBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpLFxuICAgICAgICAgICAgaW5pdCA9IG51bGw7XG5cbiAgICAgICAgLy8gMTIuMi4xXG4gICAgICAgIGlmIChzdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChpZC5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3RWYXJOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChraW5kID09PSAnY29uc3QnKSB7XG4gICAgICAgICAgICBleHBlY3QoJz0nKTtcbiAgICAgICAgICAgIGluaXQgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAobWF0Y2goJz0nKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICBpbml0ID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5WYXJpYWJsZURlY2xhcmF0b3IsXG4gICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICBpbml0OiBpbml0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uTGlzdChraW5kKSB7XG4gICAgICAgIHZhciBsaXN0ID0gW107XG5cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgbGlzdC5wdXNoKHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbihraW5kKSk7XG4gICAgICAgICAgICBpZiAoIW1hdGNoKCcsJykpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICB9IHdoaWxlIChpbmRleCA8IGxlbmd0aCk7XG5cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VWYXJpYWJsZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucztcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCd2YXInKTtcblxuICAgICAgICBkZWNsYXJhdGlvbnMgPSBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25MaXN0KCk7XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguVmFyaWFibGVEZWNsYXJhdGlvbixcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uczogZGVjbGFyYXRpb25zLFxuICAgICAgICAgICAga2luZDogJ3ZhcidcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBraW5kIG1heSBiZSBgY29uc3RgIG9yIGBsZXRgXG4gICAgLy8gQm90aCBhcmUgZXhwZXJpbWVudGFsIGFuZCBub3QgaW4gdGhlIHNwZWNpZmljYXRpb24geWV0LlxuICAgIC8vIHNlZSBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmNvbnN0XG4gICAgLy8gYW5kIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6bGV0XG4gICAgZnVuY3Rpb24gcGFyc2VDb25zdExldERlY2xhcmF0aW9uKGtpbmQpIHtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucztcblxuICAgICAgICBleHBlY3RLZXl3b3JkKGtpbmQpO1xuXG4gICAgICAgIGRlY2xhcmF0aW9ucyA9IHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbkxpc3Qoa2luZCk7XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguVmFyaWFibGVEZWNsYXJhdGlvbixcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uczogZGVjbGFyYXRpb25zLFxuICAgICAgICAgICAga2luZDoga2luZFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDEyLjMgRW1wdHkgU3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZUVtcHR5U3RhdGVtZW50KCkge1xuICAgICAgICBleHBlY3QoJzsnKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkVtcHR5U3RhdGVtZW50XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIuNCBFeHByZXNzaW9uIFN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgZXhwciA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkV4cHJlc3Npb25TdGF0ZW1lbnQsXG4gICAgICAgICAgICBleHByZXNzaW9uOiBleHByXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIuNSBJZiBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlSWZTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciB0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGU7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnaWYnKTtcblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICB0ZXN0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgY29uc2VxdWVudCA9IHBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICAgICAgaWYgKG1hdGNoS2V5d29yZCgnZWxzZScpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIGFsdGVybmF0ZSA9IHBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbHRlcm5hdGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5JZlN0YXRlbWVudCxcbiAgICAgICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgICAgICBjb25zZXF1ZW50OiBjb25zZXF1ZW50LFxuICAgICAgICAgICAgYWx0ZXJuYXRlOiBhbHRlcm5hdGVcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi42IEl0ZXJhdGlvbiBTdGF0ZW1lbnRzXG5cbiAgICBmdW5jdGlvbiBwYXJzZURvV2hpbGVTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciBib2R5LCB0ZXN0LCBvbGRJbkl0ZXJhdGlvbjtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCdkbycpO1xuXG4gICAgICAgIG9sZEluSXRlcmF0aW9uID0gc3RhdGUuaW5JdGVyYXRpb247XG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gdHJ1ZTtcblxuICAgICAgICBib2R5ID0gcGFyc2VTdGF0ZW1lbnQoKTtcblxuICAgICAgICBzdGF0ZS5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ3doaWxlJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgdGVzdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIGlmIChtYXRjaCgnOycpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguRG9XaGlsZVN0YXRlbWVudCxcbiAgICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgICB0ZXN0OiB0ZXN0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VXaGlsZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIHRlc3QsIGJvZHksIG9sZEluSXRlcmF0aW9uO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ3doaWxlJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgdGVzdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIG9sZEluSXRlcmF0aW9uID0gc3RhdGUuaW5JdGVyYXRpb247XG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gdHJ1ZTtcblxuICAgICAgICBib2R5ID0gcGFyc2VTdGF0ZW1lbnQoKTtcblxuICAgICAgICBzdGF0ZS5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguV2hpbGVTdGF0ZW1lbnQsXG4gICAgICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICAgICAgYm9keTogYm9keVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRm9yVmFyaWFibGVEZWNsYXJhdGlvbigpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5WYXJpYWJsZURlY2xhcmF0aW9uLFxuICAgICAgICAgICAgZGVjbGFyYXRpb25zOiBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25MaXN0KCksXG4gICAgICAgICAgICBraW5kOiB0b2tlbi52YWx1ZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRm9yU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgaW5pdCwgdGVzdCwgdXBkYXRlLCBsZWZ0LCByaWdodCwgYm9keSwgb2xkSW5JdGVyYXRpb247XG5cbiAgICAgICAgaW5pdCA9IHRlc3QgPSB1cGRhdGUgPSBudWxsO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2ZvcicpO1xuXG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIGlmIChtYXRjaCgnOycpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ3ZhcicpIHx8IG1hdGNoS2V5d29yZCgnbGV0JykpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaW5pdCA9IHBhcnNlRm9yVmFyaWFibGVEZWNsYXJhdGlvbigpO1xuICAgICAgICAgICAgICAgIHN0YXRlLmFsbG93SW4gPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluaXQuZGVjbGFyYXRpb25zLmxlbmd0aCA9PT0gMSAmJiBtYXRjaEtleXdvcmQoJ2luJykpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQgPSBpbml0O1xuICAgICAgICAgICAgICAgICAgICByaWdodCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgICAgICAgICBpbml0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRlLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpbml0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgc3RhdGUuYWxsb3dJbiA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCdpbicpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIExlZnRIYW5kU2lkZUV4cHJlc3Npb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0xlZnRIYW5kU2lkZShpbml0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5JbnZhbGlkTEhTSW5Gb3JJbik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGluaXQ7XG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGluaXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGV4cGVjdCgnOycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgICAgICBpZiAoIW1hdGNoKCc7JykpIHtcbiAgICAgICAgICAgICAgICB0ZXN0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleHBlY3QoJzsnKTtcblxuICAgICAgICAgICAgaWYgKCFtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICBvbGRJbkl0ZXJhdGlvbiA9IHN0YXRlLmluSXRlcmF0aW9uO1xuICAgICAgICBzdGF0ZS5pbkl0ZXJhdGlvbiA9IHRydWU7XG5cbiAgICAgICAgYm9keSA9IHBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICAgICAgc3RhdGUuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcblxuICAgICAgICBpZiAodHlwZW9mIGxlZnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Gb3JTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgaW5pdDogaW5pdCxcbiAgICAgICAgICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICAgICAgICAgIHVwZGF0ZTogdXBkYXRlLFxuICAgICAgICAgICAgICAgIGJvZHk6IGJvZHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkZvckluU3RhdGVtZW50LFxuICAgICAgICAgICAgbGVmdDogbGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiByaWdodCxcbiAgICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgICBlYWNoOiBmYWxzZVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDEyLjcgVGhlIGNvbnRpbnVlIHN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VDb250aW51ZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIHRva2VuLCBsYWJlbCA9IG51bGw7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnY29udGludWUnKTtcblxuICAgICAgICAvLyBPcHRpbWl6ZSB0aGUgbW9zdCBjb21tb24gZm9ybTogJ2NvbnRpbnVlOycuXG4gICAgICAgIGlmIChzb3VyY2VbaW5kZXhdID09PSAnOycpIHtcbiAgICAgICAgICAgIGxleCgpO1xuXG4gICAgICAgICAgICBpZiAoIXN0YXRlLmluSXRlcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuSWxsZWdhbENvbnRpbnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQ29udGludWVTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgbGFiZWw6IG51bGxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGVla0xpbmVUZXJtaW5hdG9yKCkpIHtcbiAgICAgICAgICAgIGlmICghc3RhdGUuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbGxlZ2FsQ29udGludWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Db250aW51ZVN0YXRlbWVudCxcbiAgICAgICAgICAgICAgICBsYWJlbDogbnVsbFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICBsYWJlbCA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG5cbiAgICAgICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXRlLmxhYmVsU2V0LCBsYWJlbC5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVua25vd25MYWJlbCwgbGFiZWwubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICAgICAgaWYgKGxhYmVsID09PSBudWxsICYmICFzdGF0ZS5pbkl0ZXJhdGlvbikge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuSWxsZWdhbENvbnRpbnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguQ29udGludWVTdGF0ZW1lbnQsXG4gICAgICAgICAgICBsYWJlbDogbGFiZWxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi44IFRoZSBicmVhayBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlQnJlYWtTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciB0b2tlbiwgbGFiZWwgPSBudWxsO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2JyZWFrJyk7XG5cbiAgICAgICAgLy8gT3B0aW1pemUgdGhlIG1vc3QgY29tbW9uIGZvcm06ICdicmVhazsnLlxuICAgICAgICBpZiAoc291cmNlW2luZGV4XSA9PT0gJzsnKSB7XG4gICAgICAgICAgICBsZXgoKTtcblxuICAgICAgICAgICAgaWYgKCEoc3RhdGUuaW5JdGVyYXRpb24gfHwgc3RhdGUuaW5Td2l0Y2gpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuSWxsZWdhbEJyZWFrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQnJlYWtTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgbGFiZWw6IG51bGxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGVla0xpbmVUZXJtaW5hdG9yKCkpIHtcbiAgICAgICAgICAgIGlmICghKHN0YXRlLmluSXRlcmF0aW9uIHx8IHN0YXRlLmluU3dpdGNoKSkge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxCcmVhayk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJyZWFrU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGxhYmVsOiBudWxsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIGxhYmVsID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgICAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc3RhdGUubGFiZWxTZXQsIGxhYmVsLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5rbm93bkxhYmVsLCBsYWJlbC5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICBpZiAobGFiZWwgPT09IG51bGwgJiYgIShzdGF0ZS5pbkl0ZXJhdGlvbiB8fCBzdGF0ZS5pblN3aXRjaCkpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxCcmVhayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkJyZWFrU3RhdGVtZW50LFxuICAgICAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gMTIuOSBUaGUgcmV0dXJuIHN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VSZXR1cm5TdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciB0b2tlbiwgYXJndW1lbnQgPSBudWxsO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ3JldHVybicpO1xuXG4gICAgICAgIGlmICghc3RhdGUuaW5GdW5jdGlvbkJvZHkpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuSWxsZWdhbFJldHVybik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAncmV0dXJuJyBmb2xsb3dlZCBieSBhIHNwYWNlIGFuZCBhbiBpZGVudGlmaWVyIGlzIHZlcnkgY29tbW9uLlxuICAgICAgICBpZiAoc291cmNlW2luZGV4XSA9PT0gJyAnKSB7XG4gICAgICAgICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoc291cmNlW2luZGV4ICsgMV0pKSB7XG4gICAgICAgICAgICAgICAgYXJndW1lbnQgPSBwYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlJldHVyblN0YXRlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnQ6IGFyZ3VtZW50XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwZWVrTGluZVRlcm1pbmF0b3IoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguUmV0dXJuU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50OiBudWxsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtYXRjaCgnOycpKSB7XG4gICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICAgICAgaWYgKCFtYXRjaCgnfScpICYmIHRva2VuLnR5cGUgIT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgICAgIGFyZ3VtZW50ID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5SZXR1cm5TdGF0ZW1lbnQsXG4gICAgICAgICAgICBhcmd1bWVudDogYXJndW1lbnRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi4xMCBUaGUgd2l0aCBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlV2l0aFN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIG9iamVjdCwgYm9keTtcblxuICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlN0cmljdE1vZGVXaXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ3dpdGgnKTtcblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICBvYmplY3QgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICBib2R5ID0gcGFyc2VTdGF0ZW1lbnQoKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LldpdGhTdGF0ZW1lbnQsXG4gICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIGJvZHk6IGJvZHlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMi4xMCBUaGUgc3dpdGggc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZVN3aXRjaENhc2UoKSB7XG4gICAgICAgIHZhciB0ZXN0LFxuICAgICAgICAgICAgY29uc2VxdWVudCA9IFtdLFxuICAgICAgICAgICAgc3RhdGVtZW50O1xuXG4gICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ2RlZmF1bHQnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICB0ZXN0ID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cGVjdEtleXdvcmQoJ2Nhc2UnKTtcbiAgICAgICAgICAgIHRlc3QgPSBwYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgfVxuICAgICAgICBleHBlY3QoJzonKTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnfScpIHx8IG1hdGNoS2V5d29yZCgnZGVmYXVsdCcpIHx8IG1hdGNoS2V5d29yZCgnY2FzZScpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZW1lbnQgPSBwYXJzZVN0YXRlbWVudCgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0ZW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zZXF1ZW50LnB1c2goc3RhdGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguU3dpdGNoQ2FzZSxcbiAgICAgICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgICAgICBjb25zZXF1ZW50OiBjb25zZXF1ZW50XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciBkaXNjcmltaW5hbnQsIGNhc2VzLCBjbGF1c2UsIG9sZEluU3dpdGNoLCBkZWZhdWx0Rm91bmQ7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnc3dpdGNoJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgZGlzY3JpbWluYW50ID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgICAgY2FzZXMgPSBbXTtcblxuICAgICAgICBpZiAobWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Td2l0Y2hTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgZGlzY3JpbWluYW50OiBkaXNjcmltaW5hbnQsXG4gICAgICAgICAgICAgICAgY2FzZXM6IGNhc2VzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgb2xkSW5Td2l0Y2ggPSBzdGF0ZS5pblN3aXRjaDtcbiAgICAgICAgc3RhdGUuaW5Td2l0Y2ggPSB0cnVlO1xuICAgICAgICBkZWZhdWx0Rm91bmQgPSBmYWxzZTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGF1c2UgPSBwYXJzZVN3aXRjaENhc2UoKTtcbiAgICAgICAgICAgIGlmIChjbGF1c2UudGVzdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChkZWZhdWx0Rm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuTXVsdGlwbGVEZWZhdWx0c0luU3dpdGNoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVmYXVsdEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2VzLnB1c2goY2xhdXNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG5cbiAgICAgICAgZXhwZWN0KCd9Jyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Td2l0Y2hTdGF0ZW1lbnQsXG4gICAgICAgICAgICBkaXNjcmltaW5hbnQ6IGRpc2NyaW1pbmFudCxcbiAgICAgICAgICAgIGNhc2VzOiBjYXNlc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDEyLjEzIFRoZSB0aHJvdyBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlVGhyb3dTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciBhcmd1bWVudDtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCd0aHJvdycpO1xuXG4gICAgICAgIGlmIChwZWVrTGluZVRlcm1pbmF0b3IoKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuTmV3bGluZUFmdGVyVGhyb3cpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJndW1lbnQgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5UaHJvd1N0YXRlbWVudCxcbiAgICAgICAgICAgIGFyZ3VtZW50OiBhcmd1bWVudFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDEyLjE0IFRoZSB0cnkgc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZUNhdGNoQ2xhdXNlKCkge1xuICAgICAgICB2YXIgcGFyYW07XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnY2F0Y2gnKTtcblxuICAgICAgICBleHBlY3QoJygnKTtcbiAgICAgICAgaWYgKG1hdGNoKCcpJykpIHtcbiAgICAgICAgICAgIHRocm93VW5leHBlY3RlZChsb29rYWhlYWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBwYXJhbSA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICAgIC8vIDEyLjE0LjFcbiAgICAgICAgaWYgKHN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhcmFtLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlN0cmljdENhdGNoVmFyaWFibGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5DYXRjaENsYXVzZSxcbiAgICAgICAgICAgIHBhcmFtOiBwYXJhbSxcbiAgICAgICAgICAgIGJvZHk6IHBhcnNlQmxvY2soKVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlVHJ5U3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgYmxvY2ssIGhhbmRsZXJzID0gW10sIGZpbmFsaXplciA9IG51bGw7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgndHJ5Jyk7XG5cbiAgICAgICAgYmxvY2sgPSBwYXJzZUJsb2NrKCk7XG5cbiAgICAgICAgaWYgKG1hdGNoS2V5d29yZCgnY2F0Y2gnKSkge1xuICAgICAgICAgICAgaGFuZGxlcnMucHVzaChwYXJzZUNhdGNoQ2xhdXNlKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoS2V5d29yZCgnZmluYWxseScpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIGZpbmFsaXplciA9IHBhcnNlQmxvY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYW5kbGVycy5sZW5ndGggPT09IDAgJiYgIWZpbmFsaXplcikge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuTm9DYXRjaE9yRmluYWxseSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LlRyeVN0YXRlbWVudCxcbiAgICAgICAgICAgIGJsb2NrOiBibG9jayxcbiAgICAgICAgICAgIGd1YXJkZWRIYW5kbGVyczogW10sXG4gICAgICAgICAgICBoYW5kbGVyczogaGFuZGxlcnMsXG4gICAgICAgICAgICBmaW5hbGl6ZXI6IGZpbmFsaXplclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDEyLjE1IFRoZSBkZWJ1Z2dlciBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKSB7XG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2RlYnVnZ2VyJyk7XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguRGVidWdnZXJTdGF0ZW1lbnRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMiBTdGF0ZW1lbnRzXG5cbiAgICBmdW5jdGlvbiBwYXJzZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbG9va2FoZWFkKCksXG4gICAgICAgICAgICBleHByLFxuICAgICAgICAgICAgbGFiZWxlZEJvZHk7XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5QdW5jdHVhdG9yKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlICc7JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VFbXB0eVN0YXRlbWVudCgpO1xuICAgICAgICAgICAgY2FzZSAneyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlQmxvY2soKTtcbiAgICAgICAgICAgIGNhc2UgJygnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnYnJlYWsnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUJyZWFrU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBjYXNlICdjb250aW51ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlQ29udGludWVTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ2RlYnVnZ2VyJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpO1xuICAgICAgICAgICAgY2FzZSAnZG8nOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZURvV2hpbGVTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ2Zvcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRm9yU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRnVuY3Rpb25EZWNsYXJhdGlvbigpO1xuICAgICAgICAgICAgY2FzZSAnaWYnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUlmU3RhdGVtZW50KCk7XG4gICAgICAgICAgICBjYXNlICdyZXR1cm4nOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZVJldHVyblN0YXRlbWVudCgpO1xuICAgICAgICAgICAgY2FzZSAnc3dpdGNoJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ3Rocm93JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VUaHJvd1N0YXRlbWVudCgpO1xuICAgICAgICAgICAgY2FzZSAndHJ5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VUcnlTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ3Zhcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlVmFyaWFibGVTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ3doaWxlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VXaGlsZVN0YXRlbWVudCgpO1xuICAgICAgICAgICAgY2FzZSAnd2l0aCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlV2l0aFN0YXRlbWVudCgpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICAvLyAxMi4xMiBMYWJlbGxlZCBTdGF0ZW1lbnRzXG4gICAgICAgIGlmICgoZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikgJiYgbWF0Y2goJzonKSkge1xuICAgICAgICAgICAgbGV4KCk7XG5cbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc3RhdGUubGFiZWxTZXQsIGV4cHIubmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5SZWRlY2xhcmF0aW9uLCAnTGFiZWwnLCBleHByLm5hbWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGF0ZS5sYWJlbFNldFtleHByLm5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgIGxhYmVsZWRCb2R5ID0gcGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGRlbGV0ZSBzdGF0ZS5sYWJlbFNldFtleHByLm5hbWVdO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5MYWJlbGVkU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGxhYmVsOiBleHByLFxuICAgICAgICAgICAgICAgIGJvZHk6IGxhYmVsZWRCb2R5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguRXhwcmVzc2lvblN0YXRlbWVudCxcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGV4cHJcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxMyBGdW5jdGlvbiBEZWZpbml0aW9uXG5cbiAgICBmdW5jdGlvbiBwYXJzZUZ1bmN0aW9uU291cmNlRWxlbWVudHMoKSB7XG4gICAgICAgIHZhciBzb3VyY2VFbGVtZW50LCBzb3VyY2VFbGVtZW50cyA9IFtdLCB0b2tlbiwgZGlyZWN0aXZlLCBmaXJzdFJlc3RyaWN0ZWQsXG4gICAgICAgICAgICBvbGRMYWJlbFNldCwgb2xkSW5JdGVyYXRpb24sIG9sZEluU3dpdGNoLCBvbGRJbkZ1bmN0aW9uQm9keTtcblxuICAgICAgICBleHBlY3QoJ3snKTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50cy5wdXNoKHNvdXJjZUVsZW1lbnQpO1xuICAgICAgICAgICAgaWYgKHNvdXJjZUVsZW1lbnQuZXhwcmVzc2lvbi50eXBlICE9PSBTeW50YXguTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgbm90IGRpcmVjdGl2ZVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlyZWN0aXZlID0gc2xpY2VTb3VyY2UodG9rZW4ucmFuZ2VbMF0gKyAxLCB0b2tlbi5yYW5nZVsxXSAtIDEpO1xuICAgICAgICAgICAgaWYgKGRpcmVjdGl2ZSA9PT0gJ3VzZSBzdHJpY3QnKSB7XG4gICAgICAgICAgICAgICAgc3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudChmaXJzdFJlc3RyaWN0ZWQsIE1lc3NhZ2VzLlN0cmljdE9jdGFsTGl0ZXJhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0UmVzdHJpY3RlZCAmJiB0b2tlbi5vY3RhbCkge1xuICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBvbGRMYWJlbFNldCA9IHN0YXRlLmxhYmVsU2V0O1xuICAgICAgICBvbGRJbkl0ZXJhdGlvbiA9IHN0YXRlLmluSXRlcmF0aW9uO1xuICAgICAgICBvbGRJblN3aXRjaCA9IHN0YXRlLmluU3dpdGNoO1xuICAgICAgICBvbGRJbkZ1bmN0aW9uQm9keSA9IHN0YXRlLmluRnVuY3Rpb25Cb2R5O1xuXG4gICAgICAgIHN0YXRlLmxhYmVsU2V0ID0ge307XG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gZmFsc2U7XG4gICAgICAgIHN0YXRlLmluU3dpdGNoID0gZmFsc2U7XG4gICAgICAgIHN0YXRlLmluRnVuY3Rpb25Cb2R5ID0gdHJ1ZTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZUVsZW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50cy5wdXNoKHNvdXJjZUVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCd9Jyk7XG5cbiAgICAgICAgc3RhdGUubGFiZWxTZXQgPSBvbGRMYWJlbFNldDtcbiAgICAgICAgc3RhdGUuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICAgICAgc3RhdGUuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgICAgc3RhdGUuaW5GdW5jdGlvbkJvZHkgPSBvbGRJbkZ1bmN0aW9uQm9keTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkJsb2NrU3RhdGVtZW50LFxuICAgICAgICAgICAgYm9keTogc291cmNlRWxlbWVudHNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb24oKSB7XG4gICAgICAgIHZhciBpZCwgcGFyYW0sIHBhcmFtcyA9IFtdLCBib2R5LCB0b2tlbiwgc3RyaWN0ZWQsIGZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSwgcHJldmlvdXNTdHJpY3QsIHBhcmFtU2V0O1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2Z1bmN0aW9uJyk7XG4gICAgICAgIHRva2VuID0gbG9va2FoZWFkKCk7XG4gICAgICAgIGlkID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcbiAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RGdW5jdGlvbk5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdEZ1bmN0aW9uTmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RSZXNlcnZlZFdvcmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICBpZiAoIW1hdGNoKCcpJykpIHtcbiAgICAgICAgICAgIHBhcmFtU2V0ID0ge307XG4gICAgICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICAgICAgICAgIHBhcmFtID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbVNldCwgdG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdFBhcmFtRHVwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdFBhcmFtTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RSZXNlcnZlZFdvcmQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmFtU2V0LCB0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdFBhcmFtRHVwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJhbXMucHVzaChwYXJhbSk7XG4gICAgICAgICAgICAgICAgcGFyYW1TZXRbcGFyYW0ubmFtZV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBleHBlY3QoJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIHByZXZpb3VzU3RyaWN0ID0gc3RyaWN0O1xuICAgICAgICBib2R5ID0gcGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzKCk7XG4gICAgICAgIGlmIChzdHJpY3QgJiYgZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKGZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0cmljdCAmJiBzdHJpY3RlZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHN0cmljdGVkLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBzdHJpY3QgPSBwcmV2aW91c1N0cmljdDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkZ1bmN0aW9uRGVjbGFyYXRpb24sXG4gICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgIGRlZmF1bHRzOiBbXSxcbiAgICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgICByZXN0OiBudWxsLFxuICAgICAgICAgICAgZ2VuZXJhdG9yOiBmYWxzZSxcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGZhbHNlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VGdW5jdGlvbkV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciB0b2tlbiwgaWQgPSBudWxsLCBzdHJpY3RlZCwgZmlyc3RSZXN0cmljdGVkLCBtZXNzYWdlLCBwYXJhbSwgcGFyYW1zID0gW10sIGJvZHksIHByZXZpb3VzU3RyaWN0LCBwYXJhbVNldDtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCdmdW5jdGlvbicpO1xuXG4gICAgICAgIGlmICghbWF0Y2goJygnKSkge1xuICAgICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQoKTtcbiAgICAgICAgICAgIGlkID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RGdW5jdGlvbk5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0RnVuY3Rpb25OYW1lO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdFJlc2VydmVkV29yZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICBpZiAoIW1hdGNoKCcpJykpIHtcbiAgICAgICAgICAgIHBhcmFtU2V0ID0ge307XG4gICAgICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICAgICAgICAgIHBhcmFtID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbVNldCwgdG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdFBhcmFtRHVwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdFBhcmFtTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RSZXNlcnZlZFdvcmQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmFtU2V0LCB0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdFBhcmFtRHVwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJhbXMucHVzaChwYXJhbSk7XG4gICAgICAgICAgICAgICAgcGFyYW1TZXRbcGFyYW0ubmFtZV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBleHBlY3QoJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIHByZXZpb3VzU3RyaWN0ID0gc3RyaWN0O1xuICAgICAgICBib2R5ID0gcGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzKCk7XG4gICAgICAgIGlmIChzdHJpY3QgJiYgZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKGZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0cmljdCAmJiBzdHJpY3RlZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHN0cmljdGVkLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBzdHJpY3QgPSBwcmV2aW91c1N0cmljdDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkZ1bmN0aW9uRXhwcmVzc2lvbixcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgZGVmYXVsdHM6IFtdLFxuICAgICAgICAgICAgYm9keTogYm9keSxcbiAgICAgICAgICAgIHJlc3Q6IG51bGwsXG4gICAgICAgICAgICBnZW5lcmF0b3I6IGZhbHNlLFxuICAgICAgICAgICAgZXhwcmVzc2lvbjogZmFsc2VcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyAxNCBQcm9ncmFtXG5cbiAgICBmdW5jdGlvbiBwYXJzZVNvdXJjZUVsZW1lbnQoKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IGxvb2thaGVhZCgpO1xuXG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlICdjb25zdCc6XG4gICAgICAgICAgICBjYXNlICdsZXQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUNvbnN0TGV0RGVjbGFyYXRpb24odG9rZW4udmFsdWUpO1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb24oKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlU291cmNlRWxlbWVudHMoKSB7XG4gICAgICAgIHZhciBzb3VyY2VFbGVtZW50LCBzb3VyY2VFbGVtZW50cyA9IFtdLCB0b2tlbiwgZGlyZWN0aXZlLCBmaXJzdFJlc3RyaWN0ZWQ7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZCgpO1xuICAgICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc291cmNlRWxlbWVudCA9IHBhcnNlU291cmNlRWxlbWVudCgpO1xuICAgICAgICAgICAgc291cmNlRWxlbWVudHMucHVzaChzb3VyY2VFbGVtZW50KTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VFbGVtZW50LmV4cHJlc3Npb24udHlwZSAhPT0gU3ludGF4LkxpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIG5vdCBkaXJlY3RpdmVcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpcmVjdGl2ZSA9IHNsaWNlU291cmNlKHRva2VuLnJhbmdlWzBdICsgMSwgdG9rZW4ucmFuZ2VbMV0gLSAxKTtcbiAgICAgICAgICAgIGlmIChkaXJlY3RpdmUgPT09ICd1c2Ugc3RyaWN0Jykge1xuICAgICAgICAgICAgICAgIHN0cmljdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoZmlyc3RSZXN0cmljdGVkLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdFJlc3RyaWN0ZWQgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZUVsZW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50cy5wdXNoKHNvdXJjZUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzb3VyY2VFbGVtZW50cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVByb2dyYW0oKSB7XG4gICAgICAgIHZhciBwcm9ncmFtO1xuICAgICAgICBzdHJpY3QgPSBmYWxzZTtcbiAgICAgICAgcHJvZ3JhbSA9IHtcbiAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Qcm9ncmFtLFxuICAgICAgICAgICAgYm9keTogcGFyc2VTb3VyY2VFbGVtZW50cygpXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBwcm9ncmFtO1xuICAgIH1cblxuICAgIC8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIGFyZSBuZWVkZWQgb25seSB3aGVuIHRoZSBvcHRpb24gdG8gcHJlc2VydmVcbiAgICAvLyB0aGUgY29tbWVudHMgaXMgYWN0aXZlLlxuXG4gICAgZnVuY3Rpb24gYWRkQ29tbWVudCh0eXBlLCB2YWx1ZSwgc3RhcnQsIGVuZCwgbG9jKSB7XG4gICAgICAgIGFzc2VydCh0eXBlb2Ygc3RhcnQgPT09ICdudW1iZXInLCAnQ29tbWVudCBtdXN0IGhhdmUgdmFsaWQgcG9zaXRpb24nKTtcblxuICAgICAgICAvLyBCZWNhdXNlIHRoZSB3YXkgdGhlIGFjdHVhbCB0b2tlbiBpcyBzY2FubmVkLCBvZnRlbiB0aGUgY29tbWVudHNcbiAgICAgICAgLy8gKGlmIGFueSkgYXJlIHNraXBwZWQgdHdpY2UgZHVyaW5nIHRoZSBsZXhpY2FsIGFuYWx5c2lzLlxuICAgICAgICAvLyBUaHVzLCB3ZSBuZWVkIHRvIHNraXAgYWRkaW5nIGEgY29tbWVudCBpZiB0aGUgY29tbWVudCBhcnJheSBhbHJlYWR5XG4gICAgICAgIC8vIGhhbmRsZWQgaXQuXG4gICAgICAgIGlmIChleHRyYS5jb21tZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoZXh0cmEuY29tbWVudHNbZXh0cmEuY29tbWVudHMubGVuZ3RoIC0gMV0ucmFuZ2VbMV0gPiBzdGFydCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4dHJhLmNvbW1lbnRzLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgIHJhbmdlOiBbc3RhcnQsIGVuZF0sXG4gICAgICAgICAgICBsb2M6IGxvY1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FuQ29tbWVudCgpIHtcbiAgICAgICAgdmFyIGNvbW1lbnQsIGNoLCBsb2MsIHN0YXJ0LCBibG9ja0NvbW1lbnQsIGxpbmVDb21tZW50O1xuXG4gICAgICAgIGNvbW1lbnQgPSAnJztcbiAgICAgICAgYmxvY2tDb21tZW50ID0gZmFsc2U7XG4gICAgICAgIGxpbmVDb21tZW50ID0gZmFsc2U7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG5cbiAgICAgICAgICAgIGlmIChsaW5lQ29tbWVudCkge1xuICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICAgIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2MuZW5kID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnQgLSAxXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGxpbmVDb21tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGFkZENvbW1lbnQoJ0xpbmUnLCBjb21tZW50LCBzdGFydCwgaW5kZXggLSAxLCBsb2MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICdcXHInICYmIHNvdXJjZVtpbmRleF0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICsrbGluZU51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSAnJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBsaW5lQ29tbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICBsb2MuZW5kID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogbGVuZ3RoIC0gbGluZVN0YXJ0XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGFkZENvbW1lbnQoJ0xpbmUnLCBjb21tZW50LCBzdGFydCwgbGVuZ3RoLCBsb2MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgKz0gY2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChibG9ja0NvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAnXFxyJyAmJiBzb3VyY2VbaW5kZXggKyAxXSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50ICs9ICdcXHJcXG4nO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCArPSBjaDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICArK2xpbmVOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgKz0gY2g7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSBjb21tZW50LnN1YnN0cigwLCBjb21tZW50Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrQ29tbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jLmVuZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ29tbWVudCgnQmxvY2snLCBjb21tZW50LCBzdGFydCwgaW5kZXgsIGxvYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXggKyAxXTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICBsb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xuICAgICAgICAgICAgICAgICAgICBsaW5lQ29tbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYy5lbmQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZUNvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZENvbW1lbnQoJ0xpbmUnLCBjb21tZW50LCBzdGFydCwgaW5kZXgsIGxvYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2tDb21tZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbG9jID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnQgLSAyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNXaGl0ZVNwYWNlKGNoKSkge1xuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2gpKSB7XG4gICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICAnXFxyJyAmJiBzb3VyY2VbaW5kZXhdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICArK2xpbmVOdW1iZXI7XG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0ID0gaW5kZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVyQ29tbWVudExvY2F0aW9uKCkge1xuICAgICAgICB2YXIgaSwgZW50cnksIGNvbW1lbnQsIGNvbW1lbnRzID0gW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGV4dHJhLmNvbW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBlbnRyeSA9IGV4dHJhLmNvbW1lbnRzW2ldO1xuICAgICAgICAgICAgY29tbWVudCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBlbnRyeS50eXBlLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBlbnRyeS52YWx1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgICAgICAgIGNvbW1lbnQucmFuZ2UgPSBlbnRyeS5yYW5nZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHRyYS5sb2MpIHtcbiAgICAgICAgICAgICAgICBjb21tZW50LmxvYyA9IGVudHJ5LmxvYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBleHRyYS5jb21tZW50cyA9IGNvbW1lbnRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbGxlY3RUb2tlbigpIHtcbiAgICAgICAgdmFyIHN0YXJ0LCBsb2MsIHRva2VuLCByYW5nZSwgdmFsdWU7XG5cbiAgICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgICAgbG9jID0ge1xuICAgICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0b2tlbiA9IGV4dHJhLmFkdmFuY2UoKTtcbiAgICAgICAgbG9jLmVuZCA9IHtcbiAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgcmFuZ2UgPSBbdG9rZW4ucmFuZ2VbMF0sIHRva2VuLnJhbmdlWzFdXTtcbiAgICAgICAgICAgIHZhbHVlID0gc2xpY2VTb3VyY2UodG9rZW4ucmFuZ2VbMF0sIHRva2VuLnJhbmdlWzFdKTtcbiAgICAgICAgICAgIGV4dHJhLnRva2Vucy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbk5hbWVbdG9rZW4udHlwZV0sXG4gICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZSxcbiAgICAgICAgICAgICAgICBsb2M6IGxvY1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29sbGVjdFJlZ2V4KCkge1xuICAgICAgICB2YXIgcG9zLCBsb2MsIHJlZ2V4LCB0b2tlbjtcblxuICAgICAgICBza2lwQ29tbWVudCgpO1xuXG4gICAgICAgIHBvcyA9IGluZGV4O1xuICAgICAgICBsb2MgPSB7XG4gICAgICAgICAgICBzdGFydDoge1xuICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlZ2V4ID0gZXh0cmEuc2NhblJlZ0V4cCgpO1xuICAgICAgICBsb2MuZW5kID0ge1xuICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBQb3AgdGhlIHByZXZpb3VzIHRva2VuLCB3aGljaCBpcyBsaWtlbHkgJy8nIG9yICcvPSdcbiAgICAgICAgaWYgKGV4dHJhLnRva2Vucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0b2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS50b2tlbnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAodG9rZW4ucmFuZ2VbMF0gPT09IHBvcyAmJiB0b2tlbi50eXBlID09PSAnUHVuY3R1YXRvcicpIHtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4udmFsdWUgPT09ICcvJyB8fCB0b2tlbi52YWx1ZSA9PT0gJy89Jykge1xuICAgICAgICAgICAgICAgICAgICBleHRyYS50b2tlbnMucG9wKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXh0cmEudG9rZW5zLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogJ1JlZ3VsYXJFeHByZXNzaW9uJyxcbiAgICAgICAgICAgIHZhbHVlOiByZWdleC5saXRlcmFsLFxuICAgICAgICAgICAgcmFuZ2U6IFtwb3MsIGluZGV4XSxcbiAgICAgICAgICAgIGxvYzogbG9jXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZWdleDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJUb2tlbkxvY2F0aW9uKCkge1xuICAgICAgICB2YXIgaSwgZW50cnksIHRva2VuLCB0b2tlbnMgPSBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZXh0cmEudG9rZW5zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBlbnRyeSA9IGV4dHJhLnRva2Vuc1tpXTtcbiAgICAgICAgICAgIHRva2VuID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IGVudHJ5LnR5cGUsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGVudHJ5LnZhbHVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGV4dHJhLnJhbmdlKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4ucmFuZ2UgPSBlbnRyeS5yYW5nZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHRyYS5sb2MpIHtcbiAgICAgICAgICAgICAgICB0b2tlbi5sb2MgPSBlbnRyeS5sb2M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICBleHRyYS50b2tlbnMgPSB0b2tlbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlTGl0ZXJhbCh0b2tlbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogU3ludGF4LkxpdGVyYWwsXG4gICAgICAgICAgICB2YWx1ZTogdG9rZW4udmFsdWVcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVSYXdMaXRlcmFsKHRva2VuKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBTeW50YXguTGl0ZXJhbCxcbiAgICAgICAgICAgIHZhbHVlOiB0b2tlbi52YWx1ZSxcbiAgICAgICAgICAgIHJhdzogc2xpY2VTb3VyY2UodG9rZW4ucmFuZ2VbMF0sIHRva2VuLnJhbmdlWzFdKVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uTWFya2VyKCkge1xuICAgICAgICB2YXIgbWFya2VyID0ge307XG5cbiAgICAgICAgbWFya2VyLnJhbmdlID0gW2luZGV4LCBpbmRleF07XG4gICAgICAgIG1hcmtlci5sb2MgPSB7XG4gICAgICAgICAgICBzdGFydDoge1xuICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZDoge1xuICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIG1hcmtlci5lbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnJhbmdlWzFdID0gaW5kZXg7XG4gICAgICAgICAgICB0aGlzLmxvYy5lbmQubGluZSA9IGxpbmVOdW1iZXI7XG4gICAgICAgICAgICB0aGlzLmxvYy5lbmQuY29sdW1uID0gaW5kZXggLSBsaW5lU3RhcnQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgbWFya2VyLmFwcGx5R3JvdXAgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgaWYgKGV4dHJhLnJhbmdlKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5ncm91cFJhbmdlID0gW3RoaXMucmFuZ2VbMF0sIHRoaXMucmFuZ2VbMV1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV4dHJhLmxvYykge1xuICAgICAgICAgICAgICAgIG5vZGUuZ3JvdXBMb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLmxvYy5zdGFydC5saW5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uOiB0aGlzLmxvYy5zdGFydC5jb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZW5kOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLmxvYy5lbmQubGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogdGhpcy5sb2MuZW5kLmNvbHVtblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBtYXJrZXIuYXBwbHkgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgaWYgKGV4dHJhLnJhbmdlKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5yYW5nZSA9IFt0aGlzLnJhbmdlWzBdLCB0aGlzLnJhbmdlWzFdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHRyYS5sb2MpIHtcbiAgICAgICAgICAgICAgICBub2RlLmxvYyA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IHRoaXMubG9jLnN0YXJ0LmxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IHRoaXMubG9jLnN0YXJ0LmNvbHVtblxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlbmQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IHRoaXMubG9jLmVuZC5saW5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uOiB0aGlzLmxvYy5lbmQuY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhY2tHcm91cEV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBtYXJrZXIsIGV4cHI7XG5cbiAgICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgICAgbWFya2VyID0gY3JlYXRlTG9jYXRpb25NYXJrZXIoKTtcbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgZXhwciA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIG1hcmtlci5lbmQoKTtcbiAgICAgICAgbWFya2VyLmFwcGx5R3JvdXAoZXhwcik7XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhY2tMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgbWFya2VyLCBleHByO1xuXG4gICAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICAgIG1hcmtlciA9IGNyZWF0ZUxvY2F0aW9uTWFya2VyKCk7XG5cbiAgICAgICAgZXhwciA9IG1hdGNoS2V5d29yZCgnbmV3JykgPyBwYXJzZU5ld0V4cHJlc3Npb24oKSA6IHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJy4nKSB8fCBtYXRjaCgnWycpKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgICAgIGV4cHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICBjb21wdXRlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBleHByLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcGFyc2VDb21wdXRlZE1lbWJlcigpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtYXJrZXIuZW5kKCk7XG4gICAgICAgICAgICAgICAgbWFya2VyLmFwcGx5KGV4cHIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTWVtYmVyRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IGV4cHIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG1hcmtlci5lbmQoKTtcbiAgICAgICAgICAgICAgICBtYXJrZXIuYXBwbHkoZXhwcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cmFja0xlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKSB7XG4gICAgICAgIHZhciBtYXJrZXIsIGV4cHI7XG5cbiAgICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgICAgbWFya2VyID0gY3JlYXRlTG9jYXRpb25NYXJrZXIoKTtcblxuICAgICAgICBleHByID0gbWF0Y2hLZXl3b3JkKCduZXcnKSA/IHBhcnNlTmV3RXhwcmVzc2lvbigpIDogcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICAgIHdoaWxlIChtYXRjaCgnLicpIHx8IG1hdGNoKCdbJykgfHwgbWF0Y2goJygnKSkge1xuICAgICAgICAgICAgaWYgKG1hdGNoKCcoJykpIHtcbiAgICAgICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQ2FsbEV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgIGNhbGxlZTogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgJ2FyZ3VtZW50cyc6IHBhcnNlQXJndW1lbnRzKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG1hcmtlci5lbmQoKTtcbiAgICAgICAgICAgICAgICBtYXJrZXIuYXBwbHkoZXhwcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoKCdbJykpIHtcbiAgICAgICAgICAgICAgICBleHByID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTWVtYmVyRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHBhcnNlQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbWFya2VyLmVuZCgpO1xuICAgICAgICAgICAgICAgIG1hcmtlci5hcHBseShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXhwciA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4Lk1lbWJlckV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBleHByLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcGFyc2VOb25Db21wdXRlZE1lbWJlcigpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtYXJrZXIuZW5kKCk7XG4gICAgICAgICAgICAgICAgbWFya2VyLmFwcGx5KGV4cHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVyR3JvdXAobm9kZSkge1xuICAgICAgICB2YXIgbiwgaSwgZW50cnk7XG5cbiAgICAgICAgbiA9IChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KG5vZGUpID09PSAnW29iamVjdCBBcnJheV0nKSA/IFtdIDoge307XG4gICAgICAgIGZvciAoaSBpbiBub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5oYXNPd25Qcm9wZXJ0eShpKSAmJiBpICE9PSAnZ3JvdXBSYW5nZScgJiYgaSAhPT0gJ2dyb3VwTG9jJykge1xuICAgICAgICAgICAgICAgIGVudHJ5ID0gbm9kZVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkgPT09IG51bGwgfHwgdHlwZW9mIGVudHJ5ICE9PSAnb2JqZWN0JyB8fCBlbnRyeSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICBuW2ldID0gZW50cnk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbltpXSA9IGZpbHRlckdyb3VwKGVudHJ5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd3JhcFRyYWNraW5nRnVuY3Rpb24ocmFuZ2UsIGxvYykge1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAocGFyc2VGdW5jdGlvbikge1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc0JpbmFyeShub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUudHlwZSA9PT0gU3ludGF4LkxvZ2ljYWxFeHByZXNzaW9uIHx8XG4gICAgICAgICAgICAgICAgICAgIG5vZGUudHlwZSA9PT0gU3ludGF4LkJpbmFyeUV4cHJlc3Npb247XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHZpc2l0KG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnQsIGVuZDtcblxuICAgICAgICAgICAgICAgIGlmIChpc0JpbmFyeShub2RlLmxlZnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZpc2l0KG5vZGUubGVmdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpc0JpbmFyeShub2RlLnJpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAgICB2aXNpdChub2RlLnJpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUubGVmdC5ncm91cFJhbmdlIHx8IG5vZGUucmlnaHQuZ3JvdXBSYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSBub2RlLmxlZnQuZ3JvdXBSYW5nZSA/IG5vZGUubGVmdC5ncm91cFJhbmdlWzBdIDogbm9kZS5sZWZ0LnJhbmdlWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kID0gbm9kZS5yaWdodC5ncm91cFJhbmdlID8gbm9kZS5yaWdodC5ncm91cFJhbmdlWzFdIDogbm9kZS5yaWdodC5yYW5nZVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucmFuZ2UgPSBbc3RhcnQsIGVuZF07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG5vZGUucmFuZ2UgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydCA9IG5vZGUubGVmdC5yYW5nZVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZCA9IG5vZGUucmlnaHQucmFuZ2VbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJhbmdlID0gW3N0YXJ0LCBlbmRdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsb2MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUubGVmdC5ncm91cExvYyB8fCBub2RlLnJpZ2h0Lmdyb3VwTG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydCA9IG5vZGUubGVmdC5ncm91cExvYyA/IG5vZGUubGVmdC5ncm91cExvYy5zdGFydCA6IG5vZGUubGVmdC5sb2Muc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQgPSBub2RlLnJpZ2h0Lmdyb3VwTG9jID8gbm9kZS5yaWdodC5ncm91cExvYy5lbmQgOiBub2RlLnJpZ2h0LmxvYy5lbmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmxvYyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBlbmRcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG5vZGUubG9jID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5sb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IG5vZGUubGVmdC5sb2Muc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBub2RlLnJpZ2h0LmxvYy5lbmRcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hcmtlciwgbm9kZTtcblxuICAgICAgICAgICAgICAgIHNraXBDb21tZW50KCk7XG5cbiAgICAgICAgICAgICAgICBtYXJrZXIgPSBjcmVhdGVMb2NhdGlvbk1hcmtlcigpO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBwYXJzZUZ1bmN0aW9uLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgbWFya2VyLmVuZCgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJhbmdlICYmIHR5cGVvZiBub2RlLnJhbmdlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIuYXBwbHkobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGxvYyAmJiB0eXBlb2Ygbm9kZS5sb2MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlci5hcHBseShub2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNCaW5hcnkobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmlzaXQobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhdGNoKCkge1xuXG4gICAgICAgIHZhciB3cmFwVHJhY2tpbmc7XG5cbiAgICAgICAgaWYgKGV4dHJhLmNvbW1lbnRzKSB7XG4gICAgICAgICAgICBleHRyYS5za2lwQ29tbWVudCA9IHNraXBDb21tZW50O1xuICAgICAgICAgICAgc2tpcENvbW1lbnQgPSBzY2FuQ29tbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChleHRyYS5yYXcpIHtcbiAgICAgICAgICAgIGV4dHJhLmNyZWF0ZUxpdGVyYWwgPSBjcmVhdGVMaXRlcmFsO1xuICAgICAgICAgICAgY3JlYXRlTGl0ZXJhbCA9IGNyZWF0ZVJhd0xpdGVyYWw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXh0cmEucmFuZ2UgfHwgZXh0cmEubG9jKSB7XG5cbiAgICAgICAgICAgIGV4dHJhLnBhcnNlR3JvdXBFeHByZXNzaW9uID0gcGFyc2VHcm91cEV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24gPSBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwgPSBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGw7XG4gICAgICAgICAgICBwYXJzZUdyb3VwRXhwcmVzc2lvbiA9IHRyYWNrR3JvdXBFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uID0gdHJhY2tMZWZ0SGFuZFNpZGVFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsID0gdHJhY2tMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsO1xuXG4gICAgICAgICAgICB3cmFwVHJhY2tpbmcgPSB3cmFwVHJhY2tpbmdGdW5jdGlvbihleHRyYS5yYW5nZSwgZXh0cmEubG9jKTtcblxuICAgICAgICAgICAgZXh0cmEucGFyc2VBZGRpdGl2ZUV4cHJlc3Npb24gPSBwYXJzZUFkZGl0aXZlRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24gPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VCaXR3aXNlQU5ERXhwcmVzc2lvbiA9IHBhcnNlQml0d2lzZUFOREV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUJpdHdpc2VPUkV4cHJlc3Npb24gPSBwYXJzZUJpdHdpc2VPUkV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUJpdHdpc2VYT1JFeHByZXNzaW9uID0gcGFyc2VCaXR3aXNlWE9SRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlQmxvY2sgPSBwYXJzZUJsb2NrO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzID0gcGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VDYXRjaENsYXVzZSA9IHBhcnNlQ2F0Y2hDbGF1c2U7XG4gICAgICAgICAgICBleHRyYS5wYXJzZUNvbXB1dGVkTWVtYmVyID0gcGFyc2VDb21wdXRlZE1lbWJlcjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uID0gcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUNvbnN0TGV0RGVjbGFyYXRpb24gPSBwYXJzZUNvbnN0TGV0RGVjbGFyYXRpb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZUVxdWFsaXR5RXhwcmVzc2lvbiA9IHBhcnNlRXF1YWxpdHlFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VFeHByZXNzaW9uID0gcGFyc2VFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VGb3JWYXJpYWJsZURlY2xhcmF0aW9uID0gcGFyc2VGb3JWYXJpYWJsZURlY2xhcmF0aW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VGdW5jdGlvbkRlY2xhcmF0aW9uID0gcGFyc2VGdW5jdGlvbkRlY2xhcmF0aW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VGdW5jdGlvbkV4cHJlc3Npb24gPSBwYXJzZUZ1bmN0aW9uRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlTG9naWNhbEFOREV4cHJlc3Npb24gPSBwYXJzZUxvZ2ljYWxBTkRFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VMb2dpY2FsT1JFeHByZXNzaW9uID0gcGFyc2VMb2dpY2FsT1JFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VNdWx0aXBsaWNhdGl2ZUV4cHJlc3Npb24gPSBwYXJzZU11bHRpcGxpY2F0aXZlRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlTmV3RXhwcmVzc2lvbiA9IHBhcnNlTmV3RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSA9IHBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eTtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlT2JqZWN0UHJvcGVydHkgPSBwYXJzZU9iamVjdFByb3BlcnR5O1xuICAgICAgICAgICAgZXh0cmEucGFyc2VPYmplY3RQcm9wZXJ0eUtleSA9IHBhcnNlT2JqZWN0UHJvcGVydHlLZXk7XG4gICAgICAgICAgICBleHRyYS5wYXJzZVBvc3RmaXhFeHByZXNzaW9uID0gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24gPSBwYXJzZVByaW1hcnlFeHByZXNzaW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VQcm9ncmFtID0gcGFyc2VQcm9ncmFtO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VQcm9wZXJ0eUZ1bmN0aW9uID0gcGFyc2VQcm9wZXJ0eUZ1bmN0aW9uO1xuICAgICAgICAgICAgZXh0cmEucGFyc2VSZWxhdGlvbmFsRXhwcmVzc2lvbiA9IHBhcnNlUmVsYXRpb25hbEV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZVN0YXRlbWVudCA9IHBhcnNlU3RhdGVtZW50O1xuICAgICAgICAgICAgZXh0cmEucGFyc2VTaGlmdEV4cHJlc3Npb24gPSBwYXJzZVNoaWZ0RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlU3dpdGNoQ2FzZSA9IHBhcnNlU3dpdGNoQ2FzZTtcbiAgICAgICAgICAgIGV4dHJhLnBhcnNlVW5hcnlFeHByZXNzaW9uID0gcGFyc2VVbmFyeUV4cHJlc3Npb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24gPSBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb247XG4gICAgICAgICAgICBleHRyYS5wYXJzZVZhcmlhYmxlSWRlbnRpZmllciA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyO1xuXG4gICAgICAgICAgICBwYXJzZUFkZGl0aXZlRXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUFkZGl0aXZlRXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VCaXR3aXNlQU5ERXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUJpdHdpc2VBTkRFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlQml0d2lzZU9SRXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUJpdHdpc2VPUkV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VCaXR3aXNlWE9SRXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUJpdHdpc2VYT1JFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlQmxvY2sgPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VCbG9jayk7XG4gICAgICAgICAgICBwYXJzZUZ1bmN0aW9uU291cmNlRWxlbWVudHMgPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzKTtcbiAgICAgICAgICAgIHBhcnNlQ2F0Y2hDbGF1c2UgPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VDYXRjaENsYXVzZSk7XG4gICAgICAgICAgICBwYXJzZUNvbXB1dGVkTWVtYmVyID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlQ29tcHV0ZWRNZW1iZXIpO1xuICAgICAgICAgICAgcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VDb25zdExldERlY2xhcmF0aW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlQ29uc3RMZXREZWNsYXJhdGlvbik7XG4gICAgICAgICAgICBwYXJzZUVxdWFsaXR5RXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUVxdWFsaXR5RXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZUV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlRm9yVmFyaWFibGVEZWNsYXJhdGlvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUZvclZhcmlhYmxlRGVjbGFyYXRpb24pO1xuICAgICAgICAgICAgcGFyc2VGdW5jdGlvbkRlY2xhcmF0aW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlRnVuY3Rpb25EZWNsYXJhdGlvbik7XG4gICAgICAgICAgICBwYXJzZUZ1bmN0aW9uRXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZUZ1bmN0aW9uRXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcocGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlTG9naWNhbEFOREV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VMb2dpY2FsQU5ERXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZUxvZ2ljYWxPUkV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VMb2dpY2FsT1JFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlTXVsdGlwbGljYXRpdmVFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlTXVsdGlwbGljYXRpdmVFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlTmV3RXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZU5ld0V4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VOb25Db21wdXRlZFByb3BlcnR5ID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSk7XG4gICAgICAgICAgICBwYXJzZU9iamVjdFByb3BlcnR5ID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlT2JqZWN0UHJvcGVydHkpO1xuICAgICAgICAgICAgcGFyc2VPYmplY3RQcm9wZXJ0eUtleSA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZU9iamVjdFByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VQb3N0Zml4RXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZVByaW1hcnlFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24pO1xuICAgICAgICAgICAgcGFyc2VQcm9ncmFtID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlUHJvZ3JhbSk7XG4gICAgICAgICAgICBwYXJzZVByb3BlcnR5RnVuY3Rpb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VQcm9wZXJ0eUZ1bmN0aW9uKTtcbiAgICAgICAgICAgIHBhcnNlUmVsYXRpb25hbEV4cHJlc3Npb24gPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VSZWxhdGlvbmFsRXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZVN0YXRlbWVudCA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZVN0YXRlbWVudCk7XG4gICAgICAgICAgICBwYXJzZVNoaWZ0RXhwcmVzc2lvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZVNoaWZ0RXhwcmVzc2lvbik7XG4gICAgICAgICAgICBwYXJzZVN3aXRjaENhc2UgPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VTd2l0Y2hDYXNlKTtcbiAgICAgICAgICAgIHBhcnNlVW5hcnlFeHByZXNzaW9uID0gd3JhcFRyYWNraW5nKGV4dHJhLnBhcnNlVW5hcnlFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbiA9IHdyYXBUcmFja2luZyhleHRyYS5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24pO1xuICAgICAgICAgICAgcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIgPSB3cmFwVHJhY2tpbmcoZXh0cmEucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBleHRyYS5hZHZhbmNlID0gYWR2YW5jZTtcbiAgICAgICAgICAgIGV4dHJhLnNjYW5SZWdFeHAgPSBzY2FuUmVnRXhwO1xuXG4gICAgICAgICAgICBhZHZhbmNlID0gY29sbGVjdFRva2VuO1xuICAgICAgICAgICAgc2NhblJlZ0V4cCA9IGNvbGxlY3RSZWdleDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVucGF0Y2goKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZXh0cmEuc2tpcENvbW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHNraXBDb21tZW50ID0gZXh0cmEuc2tpcENvbW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXh0cmEucmF3KSB7XG4gICAgICAgICAgICBjcmVhdGVMaXRlcmFsID0gZXh0cmEuY3JlYXRlTGl0ZXJhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChleHRyYS5yYW5nZSB8fCBleHRyYS5sb2MpIHtcbiAgICAgICAgICAgIHBhcnNlQWRkaXRpdmVFeHByZXNzaW9uID0gZXh0cmEucGFyc2VBZGRpdGl2ZUV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uID0gZXh0cmEucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlQml0d2lzZUFOREV4cHJlc3Npb24gPSBleHRyYS5wYXJzZUJpdHdpc2VBTkRFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VCaXR3aXNlT1JFeHByZXNzaW9uID0gZXh0cmEucGFyc2VCaXR3aXNlT1JFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VCaXR3aXNlWE9SRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlQml0d2lzZVhPUkV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZUJsb2NrID0gZXh0cmEucGFyc2VCbG9jaztcbiAgICAgICAgICAgIHBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cyA9IGV4dHJhLnBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cztcbiAgICAgICAgICAgIHBhcnNlQ2F0Y2hDbGF1c2UgPSBleHRyYS5wYXJzZUNhdGNoQ2xhdXNlO1xuICAgICAgICAgICAgcGFyc2VDb21wdXRlZE1lbWJlciA9IGV4dHJhLnBhcnNlQ29tcHV0ZWRNZW1iZXI7XG4gICAgICAgICAgICBwYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VDb25zdExldERlY2xhcmF0aW9uID0gZXh0cmEucGFyc2VDb25zdExldERlY2xhcmF0aW9uO1xuICAgICAgICAgICAgcGFyc2VFcXVhbGl0eUV4cHJlc3Npb24gPSBleHRyYS5wYXJzZUVxdWFsaXR5RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlRm9yVmFyaWFibGVEZWNsYXJhdGlvbiA9IGV4dHJhLnBhcnNlRm9yVmFyaWFibGVEZWNsYXJhdGlvbjtcbiAgICAgICAgICAgIHBhcnNlRnVuY3Rpb25EZWNsYXJhdGlvbiA9IGV4dHJhLnBhcnNlRnVuY3Rpb25EZWNsYXJhdGlvbjtcbiAgICAgICAgICAgIHBhcnNlRnVuY3Rpb25FeHByZXNzaW9uID0gZXh0cmEucGFyc2VGdW5jdGlvbkV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZUdyb3VwRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlR3JvdXBFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uID0gZXh0cmEucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsID0gZXh0cmEucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsO1xuICAgICAgICAgICAgcGFyc2VMb2dpY2FsQU5ERXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlTG9naWNhbEFOREV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZUxvZ2ljYWxPUkV4cHJlc3Npb24gPSBleHRyYS5wYXJzZUxvZ2ljYWxPUkV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZU11bHRpcGxpY2F0aXZlRXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlTXVsdGlwbGljYXRpdmVFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VOZXdFeHByZXNzaW9uID0gZXh0cmEucGFyc2VOZXdFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VOb25Db21wdXRlZFByb3BlcnR5ID0gZXh0cmEucGFyc2VOb25Db21wdXRlZFByb3BlcnR5O1xuICAgICAgICAgICAgcGFyc2VPYmplY3RQcm9wZXJ0eSA9IGV4dHJhLnBhcnNlT2JqZWN0UHJvcGVydHk7XG4gICAgICAgICAgICBwYXJzZU9iamVjdFByb3BlcnR5S2V5ID0gZXh0cmEucGFyc2VPYmplY3RQcm9wZXJ0eUtleTtcbiAgICAgICAgICAgIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24gPSBleHRyYS5wYXJzZVByaW1hcnlFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VQb3N0Zml4RXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlUG9zdGZpeEV4cHJlc3Npb247XG4gICAgICAgICAgICBwYXJzZVByb2dyYW0gPSBleHRyYS5wYXJzZVByb2dyYW07XG4gICAgICAgICAgICBwYXJzZVByb3BlcnR5RnVuY3Rpb24gPSBleHRyYS5wYXJzZVByb3BlcnR5RnVuY3Rpb247XG4gICAgICAgICAgICBwYXJzZVJlbGF0aW9uYWxFeHByZXNzaW9uID0gZXh0cmEucGFyc2VSZWxhdGlvbmFsRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlU3RhdGVtZW50ID0gZXh0cmEucGFyc2VTdGF0ZW1lbnQ7XG4gICAgICAgICAgICBwYXJzZVNoaWZ0RXhwcmVzc2lvbiA9IGV4dHJhLnBhcnNlU2hpZnRFeHByZXNzaW9uO1xuICAgICAgICAgICAgcGFyc2VTd2l0Y2hDYXNlID0gZXh0cmEucGFyc2VTd2l0Y2hDYXNlO1xuICAgICAgICAgICAgcGFyc2VVbmFyeUV4cHJlc3Npb24gPSBleHRyYS5wYXJzZVVuYXJ5RXhwcmVzc2lvbjtcbiAgICAgICAgICAgIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbiA9IGV4dHJhLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbjtcbiAgICAgICAgICAgIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyID0gZXh0cmEucGFyc2VWYXJpYWJsZUlkZW50aWZpZXI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGV4dHJhLnNjYW5SZWdFeHAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGFkdmFuY2UgPSBleHRyYS5hZHZhbmNlO1xuICAgICAgICAgICAgc2NhblJlZ0V4cCA9IGV4dHJhLnNjYW5SZWdFeHA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdHJpbmdUb0FycmF5KHN0cikge1xuICAgICAgICB2YXIgbGVuZ3RoID0gc3RyLmxlbmd0aCxcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdLFxuICAgICAgICAgICAgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICByZXN1bHRbaV0gPSBzdHIuY2hhckF0KGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2UoY29kZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgcHJvZ3JhbSwgdG9TdHJpbmc7XG5cbiAgICAgICAgdG9TdHJpbmcgPSBTdHJpbmc7XG4gICAgICAgIGlmICh0eXBlb2YgY29kZSAhPT0gJ3N0cmluZycgJiYgIShjb2RlIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgICAgICAgY29kZSA9IHRvU3RyaW5nKGNvZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgc291cmNlID0gY29kZTtcbiAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICBsaW5lTnVtYmVyID0gKHNvdXJjZS5sZW5ndGggPiAwKSA/IDEgOiAwO1xuICAgICAgICBsaW5lU3RhcnQgPSAwO1xuICAgICAgICBsZW5ndGggPSBzb3VyY2UubGVuZ3RoO1xuICAgICAgICBidWZmZXIgPSBudWxsO1xuICAgICAgICBzdGF0ZSA9IHtcbiAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICBsYWJlbFNldDoge30sXG4gICAgICAgICAgICBpbkZ1bmN0aW9uQm9keTogZmFsc2UsXG4gICAgICAgICAgICBpbkl0ZXJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgICBpblN3aXRjaDogZmFsc2VcbiAgICAgICAgfTtcblxuICAgICAgICBleHRyYSA9IHt9O1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBleHRyYS5yYW5nZSA9ICh0eXBlb2Ygb3B0aW9ucy5yYW5nZSA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLnJhbmdlO1xuICAgICAgICAgICAgZXh0cmEubG9jID0gKHR5cGVvZiBvcHRpb25zLmxvYyA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLmxvYztcbiAgICAgICAgICAgIGV4dHJhLnJhdyA9ICh0eXBlb2Ygb3B0aW9ucy5yYXcgPT09ICdib29sZWFuJykgJiYgb3B0aW9ucy5yYXc7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudG9rZW5zID09PSAnYm9vbGVhbicgJiYgb3B0aW9ucy50b2tlbnMpIHtcbiAgICAgICAgICAgICAgICBleHRyYS50b2tlbnMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5jb21tZW50ID09PSAnYm9vbGVhbicgJiYgb3B0aW9ucy5jb21tZW50KSB7XG4gICAgICAgICAgICAgICAgZXh0cmEuY29tbWVudHMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50b2xlcmFudCA9PT0gJ2Jvb2xlYW4nICYmIG9wdGlvbnMudG9sZXJhbnQpIHtcbiAgICAgICAgICAgICAgICBleHRyYS5lcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZVswXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBUcnkgZmlyc3QgdG8gY29udmVydCB0byBhIHN0cmluZy4gVGhpcyBpcyBnb29kIGFzIGZhc3QgcGF0aFxuICAgICAgICAgICAgICAgIC8vIGZvciBvbGQgSUUgd2hpY2ggdW5kZXJzdGFuZHMgc3RyaW5nIGluZGV4aW5nIGZvciBzdHJpbmdcbiAgICAgICAgICAgICAgICAvLyBsaXRlcmFscyBvbmx5IGFuZCBub3QgZm9yIHN0cmluZyBvYmplY3QuXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlID0gY29kZS52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRm9yY2UgYWNjZXNzaW5nIHRoZSBjaGFyYWN0ZXJzIHZpYSBhbiBhcnJheS5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZVswXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlID0gc3RyaW5nVG9BcnJheShjb2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwYXRjaCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvZ3JhbSA9IHBhcnNlUHJvZ3JhbSgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS5jb21tZW50cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJDb21tZW50TG9jYXRpb24oKTtcbiAgICAgICAgICAgICAgICBwcm9ncmFtLmNvbW1lbnRzID0gZXh0cmEuY29tbWVudHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4dHJhLnRva2VucyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJUb2tlbkxvY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgcHJvZ3JhbS50b2tlbnMgPSBleHRyYS50b2tlbnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4dHJhLmVycm9ycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmFtLmVycm9ycyA9IGV4dHJhLmVycm9ycztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHRyYS5yYW5nZSB8fCBleHRyYS5sb2MpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmFtLmJvZHkgPSBmaWx0ZXJHcm91cChwcm9ncmFtLmJvZHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdW5wYXRjaCgpO1xuICAgICAgICAgICAgZXh0cmEgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9ncmFtO1xuICAgIH1cblxuICAgIC8vIFN5bmMgd2l0aCBwYWNrYWdlLmpzb24uXG4gICAgZXhwb3J0cy52ZXJzaW9uID0gJzEuMC40JztcblxuICAgIGV4cG9ydHMucGFyc2UgPSBwYXJzZTtcblxuICAgIC8vIERlZXAgY29weS5cbiAgICBleHBvcnRzLlN5bnRheCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuYW1lLCB0eXBlcyA9IHt9O1xuXG4gICAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHlwZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChuYW1lIGluIFN5bnRheCkge1xuICAgICAgICAgICAgaWYgKFN5bnRheC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgIHR5cGVzW25hbWVdID0gU3ludGF4W25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBPYmplY3QuZnJlZXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBPYmplY3QuZnJlZXplKHR5cGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0eXBlcztcbiAgICB9KCkpO1xuXG59KSk7XG4vKiB2aW06IHNldCBzdz00IHRzPTQgZXQgdHc9ODAgOiAqL1xuIiwiLyohXG4gKiBtdXN0YWNoZS5qcyAtIExvZ2ljLWxlc3Mge3ttdXN0YWNoZX19IHRlbXBsYXRlcyB3aXRoIEphdmFTY3JpcHRcbiAqIGh0dHA6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanNcbiAqL1xuXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlKi9cblxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiBleHBvcnRzKSB7XG4gICAgZmFjdG9yeShleHBvcnRzKTsgLy8gQ29tbW9uSlNcbiAgfSBlbHNlIHtcbiAgICB2YXIgbXVzdGFjaGUgPSB7fTtcbiAgICBmYWN0b3J5KG11c3RhY2hlKTtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgIGRlZmluZShtdXN0YWNoZSk7IC8vIEFNRFxuICAgIH0gZWxzZSB7XG4gICAgICByb290Lk11c3RhY2hlID0gbXVzdGFjaGU7IC8vIDxzY3JpcHQ+XG4gICAgfVxuICB9XG59KHRoaXMsIGZ1bmN0aW9uIChtdXN0YWNoZSkge1xuXG4gIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vaXNzdWVzLmFwYWNoZS5vcmcvamlyYS9icm93c2UvQ09VQ0hEQi01NzdcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8xODlcbiAgdmFyIFJlZ0V4cF90ZXN0ID0gUmVnRXhwLnByb3RvdHlwZS50ZXN0O1xuICBmdW5jdGlvbiB0ZXN0UmVnRXhwKHJlLCBzdHJpbmcpIHtcbiAgICByZXR1cm4gUmVnRXhwX3Rlc3QuY2FsbChyZSwgc3RyaW5nKTtcbiAgfVxuXG4gIHZhciBub25TcGFjZVJlID0gL1xcUy87XG4gIGZ1bmN0aW9uIGlzV2hpdGVzcGFjZShzdHJpbmcpIHtcbiAgICByZXR1cm4gIXRlc3RSZWdFeHAobm9uU3BhY2VSZSwgc3RyaW5nKTtcbiAgfVxuXG4gIHZhciBPYmplY3RfdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBPYmplY3RfdG9TdHJpbmcuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmplY3QgPT09ICdmdW5jdGlvbic7XG4gIH1cblxuICBmdW5jdGlvbiBlc2NhcGVSZWdFeHAoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bXFwtXFxbXFxde30oKSorPy4sXFxcXFxcXiR8I1xcc10vZywgXCJcXFxcJCZcIik7XG4gIH1cblxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIFwiJlwiOiBcIiZhbXA7XCIsXG4gICAgXCI8XCI6IFwiJmx0O1wiLFxuICAgIFwiPlwiOiBcIiZndDtcIixcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICBcIi9cIjogJyYjeDJGOydcbiAgfTtcblxuICBmdW5jdGlvbiBlc2NhcGVIdG1sKHN0cmluZykge1xuICAgIHJldHVybiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIGVudGl0eU1hcFtzXTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVzY2FwZVRhZ3ModGFncykge1xuICAgIGlmICghaXNBcnJheSh0YWdzKSB8fCB0YWdzLmxlbmd0aCAhPT0gMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRhZ3M6ICcgKyB0YWdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgbmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAodGFnc1swXSkgKyBcIlxcXFxzKlwiKSxcbiAgICAgIG5ldyBSZWdFeHAoXCJcXFxccypcIiArIGVzY2FwZVJlZ0V4cCh0YWdzWzFdKSlcbiAgICBdO1xuICB9XG5cbiAgdmFyIHdoaXRlUmUgPSAvXFxzKi87XG4gIHZhciBzcGFjZVJlID0gL1xccysvO1xuICB2YXIgZXF1YWxzUmUgPSAvXFxzKj0vO1xuICB2YXIgY3VybHlSZSA9IC9cXHMqXFx9LztcbiAgdmFyIHRhZ1JlID0gLyN8XFxefFxcL3w+fFxce3wmfD18IS87XG5cbiAgLyoqXG4gICAqIEJyZWFrcyB1cCB0aGUgZ2l2ZW4gYHRlbXBsYXRlYCBzdHJpbmcgaW50byBhIHRyZWUgb2YgdG9rZW5zLiBJZiB0aGUgYHRhZ3NgXG4gICAqIGFyZ3VtZW50IGlzIGdpdmVuIGhlcmUgaXQgbXVzdCBiZSBhbiBhcnJheSB3aXRoIHR3byBzdHJpbmcgdmFsdWVzOiB0aGVcbiAgICogb3BlbmluZyBhbmQgY2xvc2luZyB0YWdzIHVzZWQgaW4gdGhlIHRlbXBsYXRlIChlLmcuIFsgXCI8JVwiLCBcIiU+XCIgXSkuIE9mXG4gICAqIGNvdXJzZSwgdGhlIGRlZmF1bHQgaXMgdG8gdXNlIG11c3RhY2hlcyAoaS5lLiBtdXN0YWNoZS50YWdzKS5cbiAgICpcbiAgICogQSB0b2tlbiBpcyBhbiBhcnJheSB3aXRoIGF0IGxlYXN0IDQgZWxlbWVudHMuIFRoZSBmaXJzdCBlbGVtZW50IGlzIHRoZVxuICAgKiBtdXN0YWNoZSBzeW1ib2wgdGhhdCB3YXMgdXNlZCBpbnNpZGUgdGhlIHRhZywgZS5nLiBcIiNcIiBvciBcIiZcIi4gSWYgdGhlIHRhZ1xuICAgKiBkaWQgbm90IGNvbnRhaW4gYSBzeW1ib2wgKGkuZS4ge3tteVZhbHVlfX0pIHRoaXMgZWxlbWVudCBpcyBcIm5hbWVcIi4gRm9yXG4gICAqIGFsbCB0ZXh0IHRoYXQgYXBwZWFycyBvdXRzaWRlIGEgc3ltYm9sIHRoaXMgZWxlbWVudCBpcyBcInRleHRcIi5cbiAgICpcbiAgICogVGhlIHNlY29uZCBlbGVtZW50IG9mIGEgdG9rZW4gaXMgaXRzIFwidmFsdWVcIi4gRm9yIG11c3RhY2hlIHRhZ3MgdGhpcyBpc1xuICAgKiB3aGF0ZXZlciBlbHNlIHdhcyBpbnNpZGUgdGhlIHRhZyBiZXNpZGVzIHRoZSBvcGVuaW5nIHN5bWJvbC4gRm9yIHRleHQgdG9rZW5zXG4gICAqIHRoaXMgaXMgdGhlIHRleHQgaXRzZWxmLlxuICAgKlxuICAgKiBUaGUgdGhpcmQgYW5kIGZvdXJ0aCBlbGVtZW50cyBvZiB0aGUgdG9rZW4gYXJlIHRoZSBzdGFydCBhbmQgZW5kIGluZGljZXMsXG4gICAqIHJlc3BlY3RpdmVseSwgb2YgdGhlIHRva2VuIGluIHRoZSBvcmlnaW5hbCB0ZW1wbGF0ZS5cbiAgICpcbiAgICogVG9rZW5zIHRoYXQgYXJlIHRoZSByb290IG5vZGUgb2YgYSBzdWJ0cmVlIGNvbnRhaW4gdHdvIG1vcmUgZWxlbWVudHM6IDEpIGFuXG4gICAqIGFycmF5IG9mIHRva2VucyBpbiB0aGUgc3VidHJlZSBhbmQgMikgdGhlIGluZGV4IGluIHRoZSBvcmlnaW5hbCB0ZW1wbGF0ZSBhdFxuICAgKiB3aGljaCB0aGUgY2xvc2luZyB0YWcgZm9yIHRoYXQgc2VjdGlvbiBiZWdpbnMuXG4gICAqL1xuICBmdW5jdGlvbiBwYXJzZVRlbXBsYXRlKHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgdGFncyA9IHRhZ3MgfHwgbXVzdGFjaGUudGFncztcbiAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlIHx8ICcnO1xuXG4gICAgaWYgKHR5cGVvZiB0YWdzID09PSAnc3RyaW5nJykge1xuICAgICAgdGFncyA9IHRhZ3Muc3BsaXQoc3BhY2VSZSk7XG4gICAgfVxuXG4gICAgdmFyIHRhZ1JlcyA9IGVzY2FwZVRhZ3ModGFncyk7XG4gICAgdmFyIHNjYW5uZXIgPSBuZXcgU2Nhbm5lcih0ZW1wbGF0ZSk7XG5cbiAgICB2YXIgc2VjdGlvbnMgPSBbXTsgICAgIC8vIFN0YWNrIHRvIGhvbGQgc2VjdGlvbiB0b2tlbnNcbiAgICB2YXIgdG9rZW5zID0gW107ICAgICAgIC8vIEJ1ZmZlciB0byBob2xkIHRoZSB0b2tlbnNcbiAgICB2YXIgc3BhY2VzID0gW107ICAgICAgIC8vIEluZGljZXMgb2Ygd2hpdGVzcGFjZSB0b2tlbnMgb24gdGhlIGN1cnJlbnQgbGluZVxuICAgIHZhciBoYXNUYWcgPSBmYWxzZTsgICAgLy8gSXMgdGhlcmUgYSB7e3RhZ319IG9uIHRoZSBjdXJyZW50IGxpbmU/XG4gICAgdmFyIG5vblNwYWNlID0gZmFsc2U7ICAvLyBJcyB0aGVyZSBhIG5vbi1zcGFjZSBjaGFyIG9uIHRoZSBjdXJyZW50IGxpbmU/XG5cbiAgICAvLyBTdHJpcHMgYWxsIHdoaXRlc3BhY2UgdG9rZW5zIGFycmF5IGZvciB0aGUgY3VycmVudCBsaW5lXG4gICAgLy8gaWYgdGhlcmUgd2FzIGEge3sjdGFnfX0gb24gaXQgYW5kIG90aGVyd2lzZSBvbmx5IHNwYWNlLlxuICAgIGZ1bmN0aW9uIHN0cmlwU3BhY2UoKSB7XG4gICAgICBpZiAoaGFzVGFnICYmICFub25TcGFjZSkge1xuICAgICAgICB3aGlsZSAoc3BhY2VzLmxlbmd0aCkge1xuICAgICAgICAgIGRlbGV0ZSB0b2tlbnNbc3BhY2VzLnBvcCgpXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3BhY2VzID0gW107XG4gICAgICB9XG5cbiAgICAgIGhhc1RhZyA9IGZhbHNlO1xuICAgICAgbm9uU3BhY2UgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3RhcnQsIHR5cGUsIHZhbHVlLCBjaHIsIHRva2VuLCBvcGVuU2VjdGlvbjtcbiAgICB3aGlsZSAoIXNjYW5uZXIuZW9zKCkpIHtcbiAgICAgIHN0YXJ0ID0gc2Nhbm5lci5wb3M7XG5cbiAgICAgIC8vIE1hdGNoIGFueSB0ZXh0IGJldHdlZW4gdGFncy5cbiAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwodGFnUmVzWzBdKTtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmFsdWUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICBjaHIgPSB2YWx1ZS5jaGFyQXQoaSk7XG5cbiAgICAgICAgICBpZiAoaXNXaGl0ZXNwYWNlKGNocikpIHtcbiAgICAgICAgICAgIHNwYWNlcy5wdXNoKHRva2Vucy5sZW5ndGgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub25TcGFjZSA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdG9rZW5zLnB1c2goWyd0ZXh0JywgY2hyLCBzdGFydCwgc3RhcnQgKyAxXSk7XG4gICAgICAgICAgc3RhcnQgKz0gMTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciB3aGl0ZXNwYWNlIG9uIHRoZSBjdXJyZW50IGxpbmUuXG4gICAgICAgICAgaWYgKGNociA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgIHN0cmlwU3BhY2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWF0Y2ggdGhlIG9wZW5pbmcgdGFnLlxuICAgICAgaWYgKCFzY2FubmVyLnNjYW4odGFnUmVzWzBdKSkgYnJlYWs7XG4gICAgICBoYXNUYWcgPSB0cnVlO1xuXG4gICAgICAvLyBHZXQgdGhlIHRhZyB0eXBlLlxuICAgICAgdHlwZSA9IHNjYW5uZXIuc2Nhbih0YWdSZSkgfHwgJ25hbWUnO1xuICAgICAgc2Nhbm5lci5zY2FuKHdoaXRlUmUpO1xuXG4gICAgICAvLyBHZXQgdGhlIHRhZyB2YWx1ZS5cbiAgICAgIGlmICh0eXBlID09PSAnPScpIHtcbiAgICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbChlcXVhbHNSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhbihlcXVhbHNSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhblVudGlsKHRhZ1Jlc1sxXSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICd7Jykge1xuICAgICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKG5ldyBSZWdFeHAoJ1xcXFxzKicgKyBlc2NhcGVSZWdFeHAoJ30nICsgdGFnc1sxXSkpKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuKGN1cmx5UmUpO1xuICAgICAgICBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMV0pO1xuICAgICAgICB0eXBlID0gJyYnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMV0pO1xuICAgICAgfVxuXG4gICAgICAvLyBNYXRjaCB0aGUgY2xvc2luZyB0YWcuXG4gICAgICBpZiAoIXNjYW5uZXIuc2Nhbih0YWdSZXNbMV0pKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgdGFnIGF0ICcgKyBzY2FubmVyLnBvcyk7XG4gICAgICB9XG5cbiAgICAgIHRva2VuID0gWyB0eXBlLCB2YWx1ZSwgc3RhcnQsIHNjYW5uZXIucG9zIF07XG4gICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG5cbiAgICAgIGlmICh0eXBlID09PSAnIycgfHwgdHlwZSA9PT0gJ14nKSB7XG4gICAgICAgIHNlY3Rpb25zLnB1c2godG9rZW4pO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnLycpIHtcbiAgICAgICAgLy8gQ2hlY2sgc2VjdGlvbiBuZXN0aW5nLlxuICAgICAgICBvcGVuU2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuXG4gICAgICAgIGlmICghb3BlblNlY3Rpb24pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vub3BlbmVkIHNlY3Rpb24gXCInICsgdmFsdWUgKyAnXCIgYXQgJyArIHN0YXJ0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3BlblNlY3Rpb25bMV0gIT09IHZhbHVlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCBzZWN0aW9uIFwiJyArIG9wZW5TZWN0aW9uWzFdICsgJ1wiIGF0ICcgKyBzdGFydCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ25hbWUnIHx8IHR5cGUgPT09ICd7JyB8fCB0eXBlID09PSAnJicpIHtcbiAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnPScpIHtcbiAgICAgICAgLy8gU2V0IHRoZSB0YWdzIGZvciB0aGUgbmV4dCB0aW1lIGFyb3VuZC5cbiAgICAgICAgdGFnUmVzID0gZXNjYXBlVGFncyh0YWdzID0gdmFsdWUuc3BsaXQoc3BhY2VSZSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGVyZSBhcmUgbm8gb3BlbiBzZWN0aW9ucyB3aGVuIHdlJ3JlIGRvbmUuXG4gICAgb3BlblNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcbiAgICBpZiAob3BlblNlY3Rpb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgc2VjdGlvbiBcIicgKyBvcGVuU2VjdGlvblsxXSArICdcIiBhdCAnICsgc2Nhbm5lci5wb3MpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXN0VG9rZW5zKHNxdWFzaFRva2Vucyh0b2tlbnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21iaW5lcyB0aGUgdmFsdWVzIG9mIGNvbnNlY3V0aXZlIHRleHQgdG9rZW5zIGluIHRoZSBnaXZlbiBgdG9rZW5zYCBhcnJheVxuICAgKiB0byBhIHNpbmdsZSB0b2tlbi5cbiAgICovXG4gIGZ1bmN0aW9uIHNxdWFzaFRva2Vucyh0b2tlbnMpIHtcbiAgICB2YXIgc3F1YXNoZWRUb2tlbnMgPSBbXTtcblxuICAgIHZhciB0b2tlbiwgbGFzdFRva2VuO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuXG4gICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgaWYgKHRva2VuWzBdID09PSAndGV4dCcgJiYgbGFzdFRva2VuICYmIGxhc3RUb2tlblswXSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgbGFzdFRva2VuWzFdICs9IHRva2VuWzFdO1xuICAgICAgICAgIGxhc3RUb2tlblszXSA9IHRva2VuWzNdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxdWFzaGVkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2VuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNxdWFzaGVkVG9rZW5zO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcm1zIHRoZSBnaXZlbiBhcnJheSBvZiBgdG9rZW5zYCBpbnRvIGEgbmVzdGVkIHRyZWUgc3RydWN0dXJlIHdoZXJlXG4gICAqIHRva2VucyB0aGF0IHJlcHJlc2VudCBhIHNlY3Rpb24gaGF2ZSB0d28gYWRkaXRpb25hbCBpdGVtczogMSkgYW4gYXJyYXkgb2ZcbiAgICogYWxsIHRva2VucyB0aGF0IGFwcGVhciBpbiB0aGF0IHNlY3Rpb24gYW5kIDIpIHRoZSBpbmRleCBpbiB0aGUgb3JpZ2luYWxcbiAgICogdGVtcGxhdGUgdGhhdCByZXByZXNlbnRzIHRoZSBlbmQgb2YgdGhhdCBzZWN0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gbmVzdFRva2Vucyh0b2tlbnMpIHtcbiAgICB2YXIgbmVzdGVkVG9rZW5zID0gW107XG4gICAgdmFyIGNvbGxlY3RvciA9IG5lc3RlZFRva2VucztcbiAgICB2YXIgc2VjdGlvbnMgPSBbXTtcblxuICAgIHZhciB0b2tlbiwgc2VjdGlvbjtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcblxuICAgICAgc3dpdGNoICh0b2tlblswXSkge1xuICAgICAgY2FzZSAnIyc6XG4gICAgICBjYXNlICdeJzpcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgICAgY29sbGVjdG9yID0gdG9rZW5bNF0gPSBbXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICcvJzpcbiAgICAgICAgc2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuICAgICAgICBzZWN0aW9uWzVdID0gdG9rZW5bMl07XG4gICAgICAgIGNvbGxlY3RvciA9IHNlY3Rpb25zLmxlbmd0aCA+IDAgPyBzZWN0aW9uc1tzZWN0aW9ucy5sZW5ndGggLSAxXVs0XSA6IG5lc3RlZFRva2VucztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb2xsZWN0b3IucHVzaCh0b2tlbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5lc3RlZFRva2VucztcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHNpbXBsZSBzdHJpbmcgc2Nhbm5lciB0aGF0IGlzIHVzZWQgYnkgdGhlIHRlbXBsYXRlIHBhcnNlciB0byBmaW5kXG4gICAqIHRva2VucyBpbiB0ZW1wbGF0ZSBzdHJpbmdzLlxuICAgKi9cbiAgZnVuY3Rpb24gU2Nhbm5lcihzdHJpbmcpIHtcbiAgICB0aGlzLnN0cmluZyA9IHN0cmluZztcbiAgICB0aGlzLnRhaWwgPSBzdHJpbmc7XG4gICAgdGhpcy5wb3MgPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSB0YWlsIGlzIGVtcHR5IChlbmQgb2Ygc3RyaW5nKS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLmVvcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50YWlsID09PSBcIlwiO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUcmllcyB0byBtYXRjaCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBSZXR1cm5zIHRoZSBtYXRjaGVkIHRleHQgaWYgaXQgY2FuIG1hdGNoLCB0aGUgZW1wdHkgc3RyaW5nIG90aGVyd2lzZS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLnNjYW4gPSBmdW5jdGlvbiAocmUpIHtcbiAgICB2YXIgbWF0Y2ggPSB0aGlzLnRhaWwubWF0Y2gocmUpO1xuXG4gICAgaWYgKG1hdGNoICYmIG1hdGNoLmluZGV4ID09PSAwKSB7XG4gICAgICB2YXIgc3RyaW5nID0gbWF0Y2hbMF07XG4gICAgICB0aGlzLnRhaWwgPSB0aGlzLnRhaWwuc3Vic3RyaW5nKHN0cmluZy5sZW5ndGgpO1xuICAgICAgdGhpcy5wb3MgKz0gc3RyaW5nLmxlbmd0aDtcbiAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNraXBzIGFsbCB0ZXh0IHVudGlsIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24gY2FuIGJlIG1hdGNoZWQuIFJldHVybnNcbiAgICogdGhlIHNraXBwZWQgc3RyaW5nLCB3aGljaCBpcyB0aGUgZW50aXJlIHRhaWwgaWYgbm8gbWF0Y2ggY2FuIGJlIG1hZGUuXG4gICAqL1xuICBTY2FubmVyLnByb3RvdHlwZS5zY2FuVW50aWwgPSBmdW5jdGlvbiAocmUpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnRhaWwuc2VhcmNoKHJlKSwgbWF0Y2g7XG5cbiAgICBzd2l0Y2ggKGluZGV4KSB7XG4gICAgY2FzZSAtMTpcbiAgICAgIG1hdGNoID0gdGhpcy50YWlsO1xuICAgICAgdGhpcy50YWlsID0gXCJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMDpcbiAgICAgIG1hdGNoID0gXCJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBtYXRjaCA9IHRoaXMudGFpbC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgdGhpcy50YWlsID0gdGhpcy50YWlsLnN1YnN0cmluZyhpbmRleCk7XG4gICAgfVxuXG4gICAgdGhpcy5wb3MgKz0gbWF0Y2gubGVuZ3RoO1xuXG4gICAgcmV0dXJuIG1hdGNoO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIGEgcmVuZGVyaW5nIGNvbnRleHQgYnkgd3JhcHBpbmcgYSB2aWV3IG9iamVjdCBhbmRcbiAgICogbWFpbnRhaW5pbmcgYSByZWZlcmVuY2UgdG8gdGhlIHBhcmVudCBjb250ZXh0LlxuICAgKi9cbiAgZnVuY3Rpb24gQ29udGV4dCh2aWV3LCBwYXJlbnRDb250ZXh0KSB7XG4gICAgdGhpcy52aWV3ID0gdmlldyA9PSBudWxsID8ge30gOiB2aWV3O1xuICAgIHRoaXMuY2FjaGUgPSB7ICcuJzogdGhpcy52aWV3IH07XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnRDb250ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY29udGV4dCB1c2luZyB0aGUgZ2l2ZW4gdmlldyB3aXRoIHRoaXMgY29udGV4dFxuICAgKiBhcyB0aGUgcGFyZW50LlxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZXh0KHZpZXcsIHRoaXMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gbmFtZSBpbiB0aGlzIGNvbnRleHQsIHRyYXZlcnNpbmdcbiAgICogdXAgdGhlIGNvbnRleHQgaGllcmFyY2h5IGlmIHRoZSB2YWx1ZSBpcyBhYnNlbnQgaW4gdGhpcyBjb250ZXh0J3Mgdmlldy5cbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLmxvb2t1cCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGlmIChuYW1lIGluIHRoaXMuY2FjaGUpIHtcbiAgICAgIHZhbHVlID0gdGhpcy5jYWNoZVtuYW1lXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuXG4gICAgICB3aGlsZSAoY29udGV4dCkge1xuICAgICAgICBpZiAobmFtZS5pbmRleE9mKCcuJykgPiAwKSB7XG4gICAgICAgICAgdmFsdWUgPSBjb250ZXh0LnZpZXc7XG5cbiAgICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KCcuJyksIGkgPSAwO1xuICAgICAgICAgIHdoaWxlICh2YWx1ZSAhPSBudWxsICYmIGkgPCBuYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWVbbmFtZXNbaSsrXV07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gY29udGV4dC52aWV3W25hbWVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIGJyZWFrO1xuXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0LnBhcmVudDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jYWNoZVtuYW1lXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMudmlldyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBIFdyaXRlciBrbm93cyBob3cgdG8gdGFrZSBhIHN0cmVhbSBvZiB0b2tlbnMgYW5kIHJlbmRlciB0aGVtIHRvIGFcbiAgICogc3RyaW5nLCBnaXZlbiBhIGNvbnRleHQuIEl0IGFsc28gbWFpbnRhaW5zIGEgY2FjaGUgb2YgdGVtcGxhdGVzIHRvXG4gICAqIGF2b2lkIHRoZSBuZWVkIHRvIHBhcnNlIHRoZSBzYW1lIHRlbXBsYXRlIHR3aWNlLlxuICAgKi9cbiAgZnVuY3Rpb24gV3JpdGVyKCkge1xuICAgIHRoaXMuY2FjaGUgPSB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIGNhY2hlZCB0ZW1wbGF0ZXMgaW4gdGhpcyB3cml0ZXIuXG4gICAqL1xuICBXcml0ZXIucHJvdG90eXBlLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jYWNoZSA9IHt9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBQYXJzZXMgYW5kIGNhY2hlcyB0aGUgZ2l2ZW4gYHRlbXBsYXRlYCBhbmQgcmV0dXJucyB0aGUgYXJyYXkgb2YgdG9rZW5zXG4gICAqIHRoYXQgaXMgZ2VuZXJhdGVkIGZyb20gdGhlIHBhcnNlLlxuICAgKi9cbiAgV3JpdGVyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHZhciBjYWNoZSA9IHRoaXMuY2FjaGU7XG4gICAgdmFyIHRva2VucyA9IGNhY2hlW3RlbXBsYXRlXTtcblxuICAgIGlmICh0b2tlbnMgPT0gbnVsbCkge1xuICAgICAgdG9rZW5zID0gY2FjaGVbdGVtcGxhdGVdID0gcGFyc2VUZW1wbGF0ZSh0ZW1wbGF0ZSwgdGFncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRva2VucztcbiAgfTtcblxuICAvKipcbiAgICogSGlnaC1sZXZlbCBtZXRob2QgdGhhdCBpcyB1c2VkIHRvIHJlbmRlciB0aGUgZ2l2ZW4gYHRlbXBsYXRlYCB3aXRoXG4gICAqIHRoZSBnaXZlbiBgdmlld2AuXG4gICAqXG4gICAqIFRoZSBvcHRpb25hbCBgcGFydGlhbHNgIGFyZ3VtZW50IG1heSBiZSBhbiBvYmplY3QgdGhhdCBjb250YWlucyB0aGVcbiAgICogbmFtZXMgYW5kIHRlbXBsYXRlcyBvZiBwYXJ0aWFscyB0aGF0IGFyZSB1c2VkIGluIHRoZSB0ZW1wbGF0ZS4gSXQgbWF5XG4gICAqIGFsc28gYmUgYSBmdW5jdGlvbiB0aGF0IGlzIHVzZWQgdG8gbG9hZCBwYXJ0aWFsIHRlbXBsYXRlcyBvbiB0aGUgZmx5XG4gICAqIHRoYXQgdGFrZXMgYSBzaW5nbGUgYXJndW1lbnQ6IHRoZSBuYW1lIG9mIHRoZSBwYXJ0aWFsLlxuICAgKi9cbiAgV3JpdGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKSB7XG4gICAgdmFyIHRva2VucyA9IHRoaXMucGFyc2UodGVtcGxhdGUpO1xuICAgIHZhciBjb250ZXh0ID0gKHZpZXcgaW5zdGFuY2VvZiBDb250ZXh0KSA/IHZpZXcgOiBuZXcgQ29udGV4dCh2aWV3KTtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJUb2tlbnModG9rZW5zLCBjb250ZXh0LCBwYXJ0aWFscywgdGVtcGxhdGUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBMb3ctbGV2ZWwgbWV0aG9kIHRoYXQgcmVuZGVycyB0aGUgZ2l2ZW4gYXJyYXkgb2YgYHRva2Vuc2AgdXNpbmdcbiAgICogdGhlIGdpdmVuIGBjb250ZXh0YCBhbmQgYHBhcnRpYWxzYC5cbiAgICpcbiAgICogTm90ZTogVGhlIGBvcmlnaW5hbFRlbXBsYXRlYCBpcyBvbmx5IGV2ZXIgdXNlZCB0byBleHRyYWN0IHRoZSBwb3J0aW9uXG4gICAqIG9mIHRoZSBvcmlnaW5hbCB0ZW1wbGF0ZSB0aGF0IHdhcyBjb250YWluZWQgaW4gYSBoaWdoZXItb3JkZXIgc2VjdGlvbi5cbiAgICogSWYgdGhlIHRlbXBsYXRlIGRvZXNuJ3QgdXNlIGhpZ2hlci1vcmRlciBzZWN0aW9ucywgdGhpcyBhcmd1bWVudCBtYXlcbiAgICogYmUgb21pdHRlZC5cbiAgICovXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVyVG9rZW5zID0gZnVuY3Rpb24gKHRva2VucywgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpIHtcbiAgICB2YXIgYnVmZmVyID0gJyc7XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gcmVuZGVyIGFuIGFyYml0cmFyeSB0ZW1wbGF0ZVxuICAgIC8vIGluIHRoZSBjdXJyZW50IGNvbnRleHQgYnkgaGlnaGVyLW9yZGVyIHNlY3Rpb25zLlxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBzdWJSZW5kZXIodGVtcGxhdGUpIHtcbiAgICAgIHJldHVybiBzZWxmLnJlbmRlcih0ZW1wbGF0ZSwgY29udGV4dCwgcGFydGlhbHMpO1xuICAgIH1cblxuICAgIHZhciB0b2tlbiwgdmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG5cbiAgICAgIHN3aXRjaCAodG9rZW5bMF0pIHtcbiAgICAgIGNhc2UgJyMnOlxuICAgICAgICB2YWx1ZSA9IGNvbnRleHQubG9va3VwKHRva2VuWzFdKTtcbiAgICAgICAgaWYgKCF2YWx1ZSkgY29udGludWU7XG5cbiAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpsZW4gPSB2YWx1ZS5sZW5ndGg7IGogPCBqbGVuOyArK2opIHtcbiAgICAgICAgICAgIGJ1ZmZlciArPSB0aGlzLnJlbmRlclRva2Vucyh0b2tlbls0XSwgY29udGV4dC5wdXNoKHZhbHVlW2pdKSwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBidWZmZXIgKz0gdGhpcy5yZW5kZXJUb2tlbnModG9rZW5bNF0sIGNvbnRleHQucHVzaCh2YWx1ZSksIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgIGlmICh0eXBlb2Ygb3JpZ2luYWxUZW1wbGF0ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBoaWdoZXItb3JkZXIgc2VjdGlvbnMgd2l0aG91dCB0aGUgb3JpZ2luYWwgdGVtcGxhdGUnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBFeHRyYWN0IHRoZSBwb3J0aW9uIG9mIHRoZSBvcmlnaW5hbCB0ZW1wbGF0ZSB0aGF0IHRoZSBzZWN0aW9uIGNvbnRhaW5zLlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUuY2FsbChjb250ZXh0LnZpZXcsIG9yaWdpbmFsVGVtcGxhdGUuc2xpY2UodG9rZW5bM10sIHRva2VuWzVdKSwgc3ViUmVuZGVyKTtcblxuICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSBidWZmZXIgKz0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmZmVyICs9IHRoaXMucmVuZGVyVG9rZW5zKHRva2VuWzRdLCBjb250ZXh0LCBwYXJ0aWFscywgb3JpZ2luYWxUZW1wbGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ14nOlxuICAgICAgICB2YWx1ZSA9IGNvbnRleHQubG9va3VwKHRva2VuWzFdKTtcblxuICAgICAgICAvLyBVc2UgSmF2YVNjcmlwdCdzIGRlZmluaXRpb24gb2YgZmFsc3kuIEluY2x1ZGUgZW1wdHkgYXJyYXlzLlxuICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanMvaXNzdWVzLzE4NlxuICAgICAgICBpZiAoIXZhbHVlIHx8IChpc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApKSB7XG4gICAgICAgICAgYnVmZmVyICs9IHRoaXMucmVuZGVyVG9rZW5zKHRva2VuWzRdLCBjb250ZXh0LCBwYXJ0aWFscywgb3JpZ2luYWxUZW1wbGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJz4nOlxuICAgICAgICBpZiAoIXBhcnRpYWxzKSBjb250aW51ZTtcbiAgICAgICAgdmFsdWUgPSBpc0Z1bmN0aW9uKHBhcnRpYWxzKSA/IHBhcnRpYWxzKHRva2VuWzFdKSA6IHBhcnRpYWxzW3Rva2VuWzFdXTtcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIGJ1ZmZlciArPSB0aGlzLnJlbmRlclRva2Vucyh0aGlzLnBhcnNlKHZhbHVlKSwgY29udGV4dCwgcGFydGlhbHMsIHZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICcmJzpcbiAgICAgICAgdmFsdWUgPSBjb250ZXh0Lmxvb2t1cCh0b2tlblsxXSk7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSBidWZmZXIgKz0gdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbmFtZSc6XG4gICAgICAgIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5bMV0pO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkgYnVmZmVyICs9IG11c3RhY2hlLmVzY2FwZSh2YWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgIGJ1ZmZlciArPSB0b2tlblsxXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZmZlcjtcbiAgfTtcblxuICBtdXN0YWNoZS5uYW1lID0gXCJtdXN0YWNoZS5qc1wiO1xuICBtdXN0YWNoZS52ZXJzaW9uID0gXCIwLjguMVwiO1xuICBtdXN0YWNoZS50YWdzID0gWyBcInt7XCIsIFwifX1cIiBdO1xuXG4gIC8vIEFsbCBoaWdoLWxldmVsIG11c3RhY2hlLiogZnVuY3Rpb25zIHVzZSB0aGlzIHdyaXRlci5cbiAgdmFyIGRlZmF1bHRXcml0ZXIgPSBuZXcgV3JpdGVyKCk7XG5cbiAgLyoqXG4gICAqIENsZWFycyBhbGwgY2FjaGVkIHRlbXBsYXRlcyBpbiB0aGUgZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBtdXN0YWNoZS5jbGVhckNhY2hlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBkZWZhdWx0V3JpdGVyLmNsZWFyQ2FjaGUoKTtcbiAgfTtcblxuICAvKipcbiAgICogUGFyc2VzIGFuZCBjYWNoZXMgdGhlIGdpdmVuIHRlbXBsYXRlIGluIHRoZSBkZWZhdWx0IHdyaXRlciBhbmQgcmV0dXJucyB0aGVcbiAgICogYXJyYXkgb2YgdG9rZW5zIGl0IGNvbnRhaW5zLiBEb2luZyB0aGlzIGFoZWFkIG9mIHRpbWUgYXZvaWRzIHRoZSBuZWVkIHRvXG4gICAqIHBhcnNlIHRlbXBsYXRlcyBvbiB0aGUgZmx5IGFzIHRoZXkgYXJlIHJlbmRlcmVkLlxuICAgKi9cbiAgbXVzdGFjaGUucGFyc2UgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHRhZ3MpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5wYXJzZSh0ZW1wbGF0ZSwgdGFncyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgdGhlIGB0ZW1wbGF0ZWAgd2l0aCB0aGUgZ2l2ZW4gYHZpZXdgIGFuZCBgcGFydGlhbHNgIHVzaW5nIHRoZVxuICAgKiBkZWZhdWx0IHdyaXRlci5cbiAgICovXG4gIG11c3RhY2hlLnJlbmRlciA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcbiAgfTtcblxuICAvLyBUaGlzIGlzIGhlcmUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggMC40LnguXG4gIG11c3RhY2hlLnRvX2h0bWwgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzLCBzZW5kKSB7XG4gICAgdmFyIHJlc3VsdCA9IG11c3RhY2hlLnJlbmRlcih0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oc2VuZCkpIHtcbiAgICAgIHNlbmQocmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBlc2NhcGluZyBmdW5jdGlvbiBzbyB0aGF0IHRoZSB1c2VyIG1heSBvdmVycmlkZSBpdC5cbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8yNDRcbiAgbXVzdGFjaGUuZXNjYXBlID0gZXNjYXBlSHRtbDtcblxuICAvLyBFeHBvcnQgdGhlc2UgbWFpbmx5IGZvciB0ZXN0aW5nLCBidXQgYWxzbyBmb3IgYWR2YW5jZWQgdXNhZ2UuXG4gIG11c3RhY2hlLlNjYW5uZXIgPSBTY2FubmVyO1xuICBtdXN0YWNoZS5Db250ZXh0ID0gQ29udGV4dDtcbiAgbXVzdGFjaGUuV3JpdGVyID0gV3JpdGVyO1xuXG59KSk7XG4iLCIvLyAgICAgVW5kZXJzY29yZS5qcyAxLjYuMFxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxNCBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS42LjAnO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBvYmo7XG4gICAgaWYgKG5hdGl2ZUZvckVhY2ggJiYgb2JqLmZvckVhY2ggPT09IG5hdGl2ZUZvckVhY2gpIHtcbiAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleXNbaV1dLCBrZXlzW2ldLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQ7XG4gICAgYW55KG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocHJlZGljYXRlLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkge1xuICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZmlsdGVyYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYHNlbGVjdGAuXG4gIF8uZmlsdGVyID0gXy5zZWxlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocHJlZGljYXRlLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkgcmVzdWx0cy5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggYSB0cnV0aCB0ZXN0IGZhaWxzLlxuICBfLnJlamVjdCA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIXByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgfSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgYWxsIG9mIHRoZSBlbGVtZW50cyBtYXRjaCBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBldmVyeWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbGxgLlxuICBfLmV2ZXJ5ID0gXy5hbGwgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHByZWRpY2F0ZSB8fCAocHJlZGljYXRlID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVFdmVyeSAmJiBvYmouZXZlcnkgPT09IG5hdGl2ZUV2ZXJ5KSByZXR1cm4gb2JqLmV2ZXJ5KHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCEocmVzdWx0ID0gcmVzdWx0ICYmIHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlIHx8IChwcmVkaWNhdGUgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocmVzdWx0IHx8IChyZXN1bHQgPSBwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiB0aGUgYXJyYXkgb3Igb2JqZWN0IGNvbnRhaW5zIGEgZ2l2ZW4gdmFsdWUgKHVzaW5nIGA9PT1gKS5cbiAgLy8gQWxpYXNlZCBhcyBgaW5jbHVkZWAuXG4gIF8uY29udGFpbnMgPSBfLmluY2x1ZGUgPSBmdW5jdGlvbihvYmosIHRhcmdldCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIG9iai5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gb2JqLmluZGV4T2YodGFyZ2V0KSAhPSAtMTtcbiAgICByZXR1cm4gYW55KG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gdGFyZ2V0O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEludm9rZSBhIG1ldGhvZCAod2l0aCBhcmd1bWVudHMpIG9uIGV2ZXJ5IGl0ZW0gaW4gYSBjb2xsZWN0aW9uLlxuICBfLmludm9rZSA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGlzRnVuYyA9IF8uaXNGdW5jdGlvbihtZXRob2QpO1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gKGlzRnVuYyA/IG1ldGhvZCA6IHZhbHVlW21ldGhvZF0pLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBtYXBgOiBmZXRjaGluZyBhIHByb3BlcnR5LlxuICBfLnBsdWNrID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBfLnByb3BlcnR5KGtleSkpO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbHRlcmA6IHNlbGVjdGluZyBvbmx5IG9iamVjdHNcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy53aGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBfLm1hdGNoZXMoYXR0cnMpKTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLmZpbmQob2JqLCBfLm1hdGNoZXMoYXR0cnMpKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1heGltdW0gZWxlbWVudCBvciAoZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIC8vIENhbid0IG9wdGltaXplIGFycmF5cyBvZiBpbnRlZ2VycyBsb25nZXIgdGhhbiA2NSw1MzUgZWxlbWVudHMuXG4gIC8vIFNlZSBbV2ViS2l0IEJ1ZyA4MDc5N10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTgwNzk3KVxuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gLUluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSAtSW5maW5pdHk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGlmIChjb21wdXRlZCA+IGxhc3RDb21wdXRlZCkge1xuICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluLmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBJbmZpbml0eSwgbGFzdENvbXB1dGVkID0gSW5maW5pdHk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGlmIChjb21wdXRlZCA8IGxhc3RDb21wdXRlZCkge1xuICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBTaHVmZmxlIGFuIGFycmF5LCB1c2luZyB0aGUgbW9kZXJuIHZlcnNpb24gb2YgdGhlXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYSBjb2xsZWN0aW9uLlxuICAvLyBJZiAqKm4qKiBpcyBub3Qgc3BlY2lmaWVkLCByZXR1cm5zIGEgc2luZ2xlIHJhbmRvbSBlbGVtZW50LlxuICAvLyBUaGUgaW50ZXJuYWwgYGd1YXJkYCBhcmd1bWVudCBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBtYXBgLlxuICBfLnNhbXBsZSA9IGZ1bmN0aW9uKG9iaiwgbiwgZ3VhcmQpIHtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSB7XG4gICAgICBpZiAob2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGgpIG9iaiA9IF8udmFsdWVzKG9iaik7XG4gICAgICByZXR1cm4gb2JqW18ucmFuZG9tKG9iai5sZW5ndGggLSAxKV07XG4gICAgfVxuICAgIHJldHVybiBfLnNodWZmbGUob2JqKS5zbGljZSgwLCBNYXRoLm1heCgwLCBuKSk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgbG9va3VwIGl0ZXJhdG9ycy5cbiAgdmFyIGxvb2t1cEl0ZXJhdG9yID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIF8uaWRlbnRpdHk7XG4gICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZSkpIHJldHVybiB2YWx1ZTtcbiAgICByZXR1cm4gXy5wcm9wZXJ0eSh2YWx1ZSk7XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdG9yLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciA9IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICByZXR1cm4gXy5wbHVjayhfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgIGNyaXRlcmlhOiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdClcbiAgICAgIH07XG4gICAgfSkuc29ydChmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhO1xuICAgICAgdmFyIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgIGlmIChhID4gYiB8fCBhID09PSB2b2lkIDApIHJldHVybiAxO1xuICAgICAgICBpZiAoYSA8IGIgfHwgYiA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4O1xuICAgIH0pLCAndmFsdWUnKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB1c2VkIGZvciBhZ2dyZWdhdGUgXCJncm91cCBieVwiIG9wZXJhdGlvbnMuXG4gIHZhciBncm91cCA9IGZ1bmN0aW9uKGJlaGF2aW9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IoaXRlcmF0b3IpO1xuICAgICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgICB2YXIga2V5ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICAgIGJlaGF2aW9yKHJlc3VsdCwga2V5LCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBHcm91cHMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbi4gUGFzcyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlXG4gIC8vIHRvIGdyb3VwIGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgY3JpdGVyaW9uLlxuICBfLmdyb3VwQnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICBfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XS5wdXNoKHZhbHVlKSA6IHJlc3VsdFtrZXldID0gW3ZhbHVlXTtcbiAgfSk7XG5cbiAgLy8gSW5kZXhlcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLCBzaW1pbGFyIHRvIGBncm91cEJ5YCwgYnV0IGZvclxuICAvLyB3aGVuIHlvdSBrbm93IHRoYXQgeW91ciBpbmRleCB2YWx1ZXMgd2lsbCBiZSB1bmlxdWUuXG4gIF8uaW5kZXhCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSkge1xuICAgIF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldKysgOiByZXN1bHRba2V5XSA9IDE7XG4gIH0pO1xuXG4gIC8vIFVzZSBhIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB0aGUgc21hbGxlc3QgaW5kZXggYXQgd2hpY2hcbiAgLy8gYW4gb2JqZWN0IHNob3VsZCBiZSBpbnNlcnRlZCBzbyBhcyB0byBtYWludGFpbiBvcmRlci4gVXNlcyBiaW5hcnkgc2VhcmNoLlxuICBfLnNvcnRlZEluZGV4ID0gZnVuY3Rpb24oYXJyYXksIG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciA9IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmICgobiA9PSBudWxsKSB8fCBndWFyZCkgcmV0dXJuIGFycmF5WzBdO1xuICAgIGlmIChuIDwgMCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBuKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBsYXN0IGVudHJ5IG9mIHRoZSBhcnJheS4gRXNwZWNpYWxseSB1c2VmdWwgb25cbiAgLy8gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gYWxsIHRoZSB2YWx1ZXMgaW5cbiAgLy8gdGhlIGFycmF5LCBleGNsdWRpbmcgdGhlIGxhc3QgTi4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoXG4gIC8vIGBfLm1hcGAuXG4gIF8uaW5pdGlhbCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBhcnJheS5sZW5ndGggLSAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbikpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmICgobiA9PSBudWxsKSB8fCBndWFyZCkgcmV0dXJuIGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCBNYXRoLm1heChhcnJheS5sZW5ndGggLSBuLCAwKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBpZiAoc2hhbGxvdyAmJiBfLmV2ZXJ5KGlucHV0LCBfLmlzQXJyYXkpKSB7XG4gICAgICByZXR1cm4gY29uY2F0LmFwcGx5KG91dHB1dCwgaW5wdXQpO1xuICAgIH1cbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBTcGxpdCBhbiBhcnJheSBpbnRvIHR3byBhcnJheXM6IG9uZSB3aG9zZSBlbGVtZW50cyBhbGwgc2F0aXNmeSB0aGUgZ2l2ZW5cbiAgLy8gcHJlZGljYXRlLCBhbmQgb25lIHdob3NlIGVsZW1lbnRzIGFsbCBkbyBub3Qgc2F0aXNmeSB0aGUgcHJlZGljYXRlLlxuICBfLnBhcnRpdGlvbiA9IGZ1bmN0aW9uKGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgICB2YXIgcGFzcyA9IFtdLCBmYWlsID0gW107XG4gICAgZWFjaChhcnJheSwgZnVuY3Rpb24oZWxlbSkge1xuICAgICAgKHByZWRpY2F0ZShlbGVtKSA/IHBhc3MgOiBmYWlsKS5wdXNoKGVsZW0pO1xuICAgIH0pO1xuICAgIHJldHVybiBbcGFzcywgZmFpbF07XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhIGR1cGxpY2F0ZS1mcmVlIHZlcnNpb24gb2YgdGhlIGFycmF5LiBJZiB0aGUgYXJyYXkgaGFzIGFscmVhZHlcbiAgLy8gYmVlbiBzb3J0ZWQsIHlvdSBoYXZlIHRoZSBvcHRpb24gb2YgdXNpbmcgYSBmYXN0ZXIgYWxnb3JpdGhtLlxuICAvLyBBbGlhc2VkIGFzIGB1bmlxdWVgLlxuICBfLnVuaXEgPSBfLnVuaXF1ZSA9IGZ1bmN0aW9uKGFycmF5LCBpc1NvcnRlZCwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdG9yO1xuICAgICAgaXRlcmF0b3IgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHZhciBpbml0aWFsID0gaXRlcmF0b3IgPyBfLm1hcChhcnJheSwgaXRlcmF0b3IsIGNvbnRleHQpIDogYXJyYXk7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGVhY2goaW5pdGlhbCwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICBpZiAoaXNTb3J0ZWQgPyAoIWluZGV4IHx8IHNlZW5bc2Vlbi5sZW5ndGggLSAxXSAhPT0gdmFsdWUpIDogIV8uY29udGFpbnMoc2VlbiwgdmFsdWUpKSB7XG4gICAgICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG4gICAgICAgIHJlc3VsdHMucHVzaChhcnJheVtpbmRleF0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgdW5pb246IGVhY2ggZGlzdGluY3QgZWxlbWVudCBmcm9tIGFsbCBvZlxuICAvLyB0aGUgcGFzc2VkLWluIGFycmF5cy5cbiAgXy51bmlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuaXEoXy5mbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyBldmVyeSBpdGVtIHNoYXJlZCBiZXR3ZWVuIGFsbCB0aGVcbiAgLy8gcGFzc2VkLWluIGFycmF5cy5cbiAgXy5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBfLmZpbHRlcihfLnVuaXEoYXJyYXkpLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gXy5ldmVyeShyZXN0LCBmdW5jdGlvbihvdGhlcikge1xuICAgICAgICByZXR1cm4gXy5jb250YWlucyhvdGhlciwgaXRlbSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmd1bWVudHMsICdsZW5ndGgnKS5jb25jYXQoMCkpO1xuICAgIHZhciByZXN1bHRzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0c1tpXSA9IF8ucGx1Y2soYXJndW1lbnRzLCAnJyArIGkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBDb252ZXJ0cyBsaXN0cyBpbnRvIG9iamVjdHMuIFBhc3MgZWl0aGVyIGEgc2luZ2xlIGFycmF5IG9mIGBba2V5LCB2YWx1ZV1gXG4gIC8vIHBhaXJzLCBvciB0d28gcGFyYWxsZWwgYXJyYXlzIG9mIHRoZSBzYW1lIGxlbmd0aCAtLSBvbmUgb2Yga2V5cywgYW5kIG9uZSBvZlxuICAvLyB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXMuXG4gIF8ub2JqZWN0ID0gZnVuY3Rpb24obGlzdCwgdmFsdWVzKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIHt9O1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXN1bHRbbGlzdFtpXV0gPSB2YWx1ZXNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbbGlzdFtpXVswXV0gPSBsaXN0W2ldWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIElmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcGx5IHVzIHdpdGggaW5kZXhPZiAoSSdtIGxvb2tpbmcgYXQgeW91LCAqKk1TSUUqKiksXG4gIC8vIHdlIG5lZWQgdGhpcyBmdW5jdGlvbi4gUmV0dXJuIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhblxuICAvLyBpdGVtIGluIGFuIGFycmF5LCBvciAtMSBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgaW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICAvLyBJZiB0aGUgYXJyYXkgaXMgbGFyZ2UgYW5kIGFscmVhZHkgaW4gc29ydCBvcmRlciwgcGFzcyBgdHJ1ZWBcbiAgLy8gZm9yICoqaXNTb3J0ZWQqKiB0byB1c2UgYmluYXJ5IHNlYXJjaC5cbiAgXy5pbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGlzU29ydGVkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcbiAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgaXNTb3J0ZWQgPT0gJ251bWJlcicpIHtcbiAgICAgICAgaSA9IChpc1NvcnRlZCA8IDAgPyBNYXRoLm1heCgwLCBsZW5ndGggKyBpc1NvcnRlZCkgOiBpc1NvcnRlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gXy5zb3J0ZWRJbmRleChhcnJheSwgaXRlbSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpXSA9PT0gaXRlbSA/IGkgOiAtMTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgYXJyYXkuaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIGFycmF5LmluZGV4T2YoaXRlbSwgaXNTb3J0ZWQpO1xuICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBsYXN0SW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICBfLmxhc3RJbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGZyb20pIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBoYXNJbmRleCA9IGZyb20gIT0gbnVsbDtcbiAgICBpZiAobmF0aXZlTGFzdEluZGV4T2YgJiYgYXJyYXkubGFzdEluZGV4T2YgPT09IG5hdGl2ZUxhc3RJbmRleE9mKSB7XG4gICAgICByZXR1cm4gaGFzSW5kZXggPyBhcnJheS5sYXN0SW5kZXhPZihpdGVtLCBmcm9tKSA6IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0pO1xuICAgIH1cbiAgICB2YXIgaSA9IChoYXNJbmRleCA/IGZyb20gOiBhcnJheS5sZW5ndGgpO1xuICAgIHdoaWxlIChpLS0pIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGFuIGludGVnZXIgQXJyYXkgY29udGFpbmluZyBhbiBhcml0aG1ldGljIHByb2dyZXNzaW9uLiBBIHBvcnQgb2ZcbiAgLy8gdGhlIG5hdGl2ZSBQeXRob24gYHJhbmdlKClgIGZ1bmN0aW9uLiBTZWVcbiAgLy8gW3RoZSBQeXRob24gZG9jdW1lbnRhdGlvbl0oaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L2Z1bmN0aW9ucy5odG1sI3JhbmdlKS5cbiAgXy5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHN0ZXAgPSBhcmd1bWVudHNbMl0gfHwgMTtcblxuICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKSwgMCk7XG4gICAgdmFyIGlkeCA9IDA7XG4gICAgdmFyIHJhbmdlID0gbmV3IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZShpZHggPCBsZW5ndGgpIHtcbiAgICAgIHJhbmdlW2lkeCsrXSA9IHN0YXJ0O1xuICAgICAgc3RhcnQgKz0gc3RlcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZ2U7XG4gIH07XG5cbiAgLy8gRnVuY3Rpb24gKGFoZW0pIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXVzYWJsZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgcHJvdG90eXBlIHNldHRpbmcuXG4gIHZhciBjdG9yID0gZnVuY3Rpb24oKXt9O1xuXG4gIC8vIENyZWF0ZSBhIGZ1bmN0aW9uIGJvdW5kIHRvIGEgZ2l2ZW4gb2JqZWN0IChhc3NpZ25pbmcgYHRoaXNgLCBhbmQgYXJndW1lbnRzLFxuICAvLyBvcHRpb25hbGx5KS4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYEZ1bmN0aW9uLmJpbmRgIGlmXG4gIC8vIGF2YWlsYWJsZS5cbiAgXy5iaW5kID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCkge1xuICAgIHZhciBhcmdzLCBib3VuZDtcbiAgICBpZiAobmF0aXZlQmluZCAmJiBmdW5jLmJpbmQgPT09IG5hdGl2ZUJpbmQpIHJldHVybiBuYXRpdmVCaW5kLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgaWYgKCFfLmlzRnVuY3Rpb24oZnVuYykpIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gYm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkpIHJldHVybiBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBzZWxmID0gbmV3IGN0b3I7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IG51bGw7XG4gICAgICB2YXIgcmVzdWx0ID0gZnVuYy5hcHBseShzZWxmLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIGlmIChPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0KSByZXR1cm4gcmVzdWx0O1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcbiAgfTtcblxuICAvLyBQYXJ0aWFsbHkgYXBwbHkgYSBmdW5jdGlvbiBieSBjcmVhdGluZyBhIHZlcnNpb24gdGhhdCBoYXMgaGFkIHNvbWUgb2YgaXRzXG4gIC8vIGFyZ3VtZW50cyBwcmUtZmlsbGVkLCB3aXRob3V0IGNoYW5naW5nIGl0cyBkeW5hbWljIGB0aGlzYCBjb250ZXh0LiBfIGFjdHNcbiAgLy8gYXMgYSBwbGFjZWhvbGRlciwgYWxsb3dpbmcgYW55IGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyB0byBiZSBwcmUtZmlsbGVkLlxuICBfLnBhcnRpYWwgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIGJvdW5kQXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcG9zaXRpb24gPSAwO1xuICAgICAgdmFyIGFyZ3MgPSBib3VuZEFyZ3Muc2xpY2UoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBhcmdzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhcmdzW2ldID09PSBfKSBhcmdzW2ldID0gYXJndW1lbnRzW3Bvc2l0aW9uKytdO1xuICAgICAgfVxuICAgICAgd2hpbGUgKHBvc2l0aW9uIDwgYXJndW1lbnRzLmxlbmd0aCkgYXJncy5wdXNoKGFyZ3VtZW50c1twb3NpdGlvbisrXSk7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYSBudW1iZXIgb2YgYW4gb2JqZWN0J3MgbWV0aG9kcyB0byB0aGF0IG9iamVjdC4gUmVtYWluaW5nIGFyZ3VtZW50c1xuICAvLyBhcmUgdGhlIG1ldGhvZCBuYW1lcyB0byBiZSBib3VuZC4gVXNlZnVsIGZvciBlbnN1cmluZyB0aGF0IGFsbCBjYWxsYmFja3NcbiAgLy8gZGVmaW5lZCBvbiBhbiBvYmplY3QgYmVsb25nIHRvIGl0LlxuICBfLmJpbmRBbGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgZnVuY3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKGZ1bmNzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKCdiaW5kQWxsIG11c3QgYmUgcGFzc2VkIGZ1bmN0aW9uIG5hbWVzJyk7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBfLm5vdygpO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5vdyA9IF8ubm93KCk7XG4gICAgICBpZiAoIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UpIHByZXZpb3VzID0gbm93O1xuICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcblxuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxhc3QgPSBfLm5vdygpIC0gdGltZXN0YW1wO1xuICAgICAgaWYgKGxhc3QgPCB3YWl0KSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHtcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBfLm5vdygpO1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxOb3cpIHtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIF8ucGFydGlhbCh3cmFwcGVyLCBmdW5jKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgYSBsaXN0IG9mIGZ1bmN0aW9ucywgZWFjaFxuICAvLyBjb25zdW1pbmcgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICBfLmNvbXBvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBmb3IgKHZhciBpID0gZnVuY3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgYXJncyA9IFtmdW5jc1tpXS5hcHBseSh0aGlzLCBhcmdzKV07XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJnc1swXTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBhZnRlciBiZWluZyBjYWxsZWQgTiB0aW1lcy5cbiAgXy5hZnRlciA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPCAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICAvLyBPYmplY3QgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbmFtZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYE9iamVjdC5rZXlzYFxuICBfLmtleXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIFtdO1xuICAgIGlmIChuYXRpdmVLZXlzKSByZXR1cm4gbmF0aXZlS2V5cyhvYmopO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICBfLnZhbHVlcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWx1ZXNbaV0gPSBvYmpba2V5c1tpXV07XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH07XG5cbiAgLy8gQ29udmVydCBhbiBvYmplY3QgaW50byBhIGxpc3Qgb2YgYFtrZXksIHZhbHVlXWAgcGFpcnMuXG4gIF8ucGFpcnMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgcGFpcnMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBwYWlyc1tpXSA9IFtrZXlzW2ldLCBvYmpba2V5c1tpXV1dO1xuICAgIH1cbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRbb2JqW2tleXNbaV1dXSA9IGtleXNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IG9ubHkgY29udGFpbmluZyB0aGUgd2hpdGVsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5waWNrID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5IGluIG9iaikgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCB3aXRob3V0IHRoZSBibGFja2xpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLm9taXQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKCFfLmNvbnRhaW5zKGtleXMsIGtleSkpIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIGlmIChvYmpbcHJvcF0gPT09IHZvaWQgMCkgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSAoc2hhbGxvdy1jbG9uZWQpIGR1cGxpY2F0ZSBvZiBhbiBvYmplY3QuXG4gIF8uY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gXy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IF8uZXh0ZW5kKHt9LCBvYmopO1xuICB9O1xuXG4gIC8vIEludm9rZXMgaW50ZXJjZXB0b3Igd2l0aCB0aGUgb2JqLCBhbmQgdGhlbiByZXR1cm5zIG9iai5cbiAgLy8gVGhlIHByaW1hcnkgcHVycG9zZSBvZiB0aGlzIG1ldGhvZCBpcyB0byBcInRhcCBpbnRvXCIgYSBtZXRob2QgY2hhaW4sIGluXG4gIC8vIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW4gdGhlIGNoYWluLlxuICBfLnRhcCA9IGZ1bmN0aW9uKG9iaiwgaW50ZXJjZXB0b3IpIHtcbiAgICBpbnRlcmNlcHRvcihvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgcmVjdXJzaXZlIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGBpc0VxdWFsYC5cbiAgdmFyIGVxID0gZnVuY3Rpb24oYSwgYiwgYVN0YWNrLCBiU3RhY2spIHtcbiAgICAvLyBJZGVudGljYWwgb2JqZWN0cyBhcmUgZXF1YWwuIGAwID09PSAtMGAsIGJ1dCB0aGV5IGFyZW4ndCBpZGVudGljYWwuXG4gICAgLy8gU2VlIHRoZSBbSGFybW9ueSBgZWdhbGAgcHJvcG9zYWxdKGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6ZWdhbCkuXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPSB0b1N0cmluZy5jYWxsKGIpKSByZXR1cm4gZmFsc2U7XG4gICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgIC8vIFN0cmluZ3MsIG51bWJlcnMsIGRhdGVzLCBhbmQgYm9vbGVhbnMgYXJlIGNvbXBhcmVkIGJ5IHZhbHVlLlxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gYSA9PSBTdHJpbmcoYik7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLiBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yXG4gICAgICAgIC8vIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gYSAhPSArYSA/IGIgIT0gK2IgOiAoYSA9PSAwID8gMSAvIGEgPT0gMSAvIGIgOiBhID09ICtiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtZXJpYyBwcmltaXRpdmUgdmFsdWVzLiBEYXRlcyBhcmUgY29tcGFyZWQgYnkgdGhlaXJcbiAgICAgICAgLy8gbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zLiBOb3RlIHRoYXQgaW52YWxpZCBkYXRlcyB3aXRoIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9uc1xuICAgICAgICAvLyBvZiBgTmFOYCBhcmUgbm90IGVxdWl2YWxlbnQuXG4gICAgICAgIHJldHVybiArYSA9PSArYjtcbiAgICAgIC8vIFJlZ0V4cHMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyIHNvdXJjZSBwYXR0ZXJucyBhbmQgZmxhZ3MuXG4gICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgICByZXR1cm4gYS5zb3VyY2UgPT0gYi5zb3VyY2UgJiZcbiAgICAgICAgICAgICAgIGEuZ2xvYmFsID09IGIuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICBhLm11bHRpbGluZSA9PSBiLm11bHRpbGluZSAmJlxuICAgICAgICAgICAgICAgYS5pZ25vcmVDYXNlID09IGIuaWdub3JlQ2FzZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT0gYSkgcmV0dXJuIGJTdGFja1tsZW5ndGhdID09IGI7XG4gICAgfVxuICAgIC8vIE9iamVjdHMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1aXZhbGVudCwgYnV0IGBPYmplY3Rgc1xuICAgIC8vIGZyb20gZGlmZmVyZW50IGZyYW1lcyBhcmUuXG4gICAgdmFyIGFDdG9yID0gYS5jb25zdHJ1Y3RvciwgYkN0b3IgPSBiLmNvbnN0cnVjdG9yO1xuICAgIGlmIChhQ3RvciAhPT0gYkN0b3IgJiYgIShfLmlzRnVuY3Rpb24oYUN0b3IpICYmIChhQ3RvciBpbnN0YW5jZW9mIGFDdG9yKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmlzRnVuY3Rpb24oYkN0b3IpICYmIChiQ3RvciBpbnN0YW5jZW9mIGJDdG9yKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICYmICgnY29uc3RydWN0b3InIGluIGEgJiYgJ2NvbnN0cnVjdG9yJyBpbiBiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgXy5jb25zdGFudCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICB9O1xuXG4gIF8ucHJvcGVydHkgPSBmdW5jdGlvbihrZXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgcHJlZGljYXRlIGZvciBjaGVja2luZyB3aGV0aGVyIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBzZXQgb2YgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ubWF0Y2hlcyA9IGZ1bmN0aW9uKGF0dHJzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgaWYgKG9iaiA9PT0gYXR0cnMpIHJldHVybiB0cnVlOyAvL2F2b2lkIGNvbXBhcmluZyBhbiBvYmplY3QgdG8gaXRzZWxmLlxuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmIChhdHRyc1trZXldICE9PSBvYmpba2V5XSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBBIChwb3NzaWJseSBmYXN0ZXIpIHdheSB0byBnZXQgdGhlIGN1cnJlbnQgdGltZXN0YW1wIGFzIGFuIGludGVnZXIuXG4gIF8ubm93ID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG4gIC8vIEFNRCByZWdpc3RyYXRpb24gaGFwcGVucyBhdCB0aGUgZW5kIGZvciBjb21wYXRpYmlsaXR5IHdpdGggQU1EIGxvYWRlcnNcbiAgLy8gdGhhdCBtYXkgbm90IGVuZm9yY2UgbmV4dC10dXJuIHNlbWFudGljcyBvbiBtb2R1bGVzLiBFdmVuIHRob3VnaCBnZW5lcmFsXG4gIC8vIHByYWN0aWNlIGZvciBBTUQgcmVnaXN0cmF0aW9uIGlzIHRvIGJlIGFub255bW91cywgdW5kZXJzY29yZSByZWdpc3RlcnNcbiAgLy8gYXMgYSBuYW1lZCBtb2R1bGUgYmVjYXVzZSwgbGlrZSBqUXVlcnksIGl0IGlzIGEgYmFzZSBsaWJyYXJ5IHRoYXQgaXNcbiAgLy8gcG9wdWxhciBlbm91Z2ggdG8gYmUgYnVuZGxlZCBpbiBhIHRoaXJkIHBhcnR5IGxpYiwgYnV0IG5vdCBiZSBwYXJ0IG9mXG4gIC8vIGFuIEFNRCBsb2FkIHJlcXVlc3QuIFRob3NlIGNhc2VzIGNvdWxkIGdlbmVyYXRlIGFuIGVycm9yIHdoZW4gYW5cbiAgLy8gYW5vbnltb3VzIGRlZmluZSgpIGlzIGNhbGxlZCBvdXRzaWRlIG9mIGEgbG9hZGVyIHJlcXVlc3QuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ3VuZGVyc2NvcmUnLCBbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXztcbiAgICB9KTtcbiAgfVxufSkuY2FsbCh0aGlzKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGV4dDtcblxuXG5cbmZ1bmN0aW9uIENvbnRleHQoX2JvdW5kcywgX21hdHJpeCkge1xuXHR0aGlzLmJvdW5kcyA9IF9ib3VuZHMgPyBfYm91bmRzLmNsb25lKCkgOiBuZXcgcGFwZXIuUmVjdGFuZ2xlKDAsIDAsIDAsIDApO1xuXHR0aGlzLm1hdHJpeCA9IF9tYXRyaXggPyBfbWF0cml4LmNsb25lKCkgOiBuZXcgcGFwZXIuTWF0cml4KCk7XG59XG5cbkNvbnRleHQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBcIkNvbnRleHQ6IFwiICsgdGhpcy5ib3VuZHM7XG59O1xuXG5cbkNvbnRleHQucHJvdG90eXBlLmRlcml2ZUNvbnRleHQgPSBmdW5jdGlvbihfcHJvcGVydGllcykge1xuXG5cdC8vIENhbGN1bGF0ZSBCb3VuZHNcblx0dmFyIGRlcml2ZWRCb3VuZHMgPSBuZXcgcGFwZXIuUmVjdGFuZ2xlKCk7XG5cblx0ZGVyaXZlZEJvdW5kcy50b3AgPSBkZXJpdmVCb3VuZChcblx0XHR0aGlzLmJvdW5kcy50b3AsIHRoaXMuYm91bmRzLmJvdHRvbSxcblx0XHRfcHJvcGVydGllcy50b3AsIF9wcm9wZXJ0aWVzLm1hcmdpbl90b3AsIF9wcm9wZXJ0aWVzLmJvdHRvbSwgX3Byb3BlcnRpZXMubWFyZ2luX2JvdHRvbSwgX3Byb3BlcnRpZXMuaGVpZ2h0LCAtMVxuXHQpO1xuXG5cdGRlcml2ZWRCb3VuZHMuYm90dG9tID0gZGVyaXZlQm91bmQoXG5cdFx0dGhpcy5ib3VuZHMuYm90dG9tLCB0aGlzLmJvdW5kcy50b3AsXG5cdFx0X3Byb3BlcnRpZXMuYm90dG9tLCBfcHJvcGVydGllcy5tYXJnaW5fYm90dG9tLCBfcHJvcGVydGllcy50b3AsIF9wcm9wZXJ0aWVzLm1hcmdpbl90b3AsIF9wcm9wZXJ0aWVzLmhlaWdodCwgMVxuXHQpO1xuXG5cdGRlcml2ZWRCb3VuZHMubGVmdCA9IGRlcml2ZUJvdW5kKFxuXHRcdHRoaXMuYm91bmRzLmxlZnQsIHRoaXMuYm91bmRzLnJpZ2h0LFxuXHRcdF9wcm9wZXJ0aWVzLmxlZnQsIF9wcm9wZXJ0aWVzLm1hcmdpbl9sZWZ0LCBfcHJvcGVydGllcy5yaWdodCwgX3Byb3BlcnRpZXMubWFyZ2luX3JpZ2h0LCBfcHJvcGVydGllcy53aWR0aCwgLTFcblx0KTtcblxuXHRkZXJpdmVkQm91bmRzLnJpZ2h0ID0gZGVyaXZlQm91bmQoXG5cdFx0dGhpcy5ib3VuZHMucmlnaHQsIHRoaXMuYm91bmRzLmxlZnQsXG5cdFx0X3Byb3BlcnRpZXMucmlnaHQsIF9wcm9wZXJ0aWVzLm1hcmdpbl9yaWdodCwgX3Byb3BlcnRpZXMubGVmdCwgX3Byb3BlcnRpZXMubWFyZ2luX2xlZnQsIF9wcm9wZXJ0aWVzLndpZHRoLCAxXG5cdCk7XG5cblxuXG5cdC8vIENhbGN1bGF0ZSBNYXRyaXhcblx0dmFyIGRlcml2ZWRNYXRyaXggPSB0aGlzLm1hdHJpeC5jbG9uZSgpO1xuXHR2YXIgZGVyaXZlZENvbnRleHQgPSBuZXcgQ29udGV4dChkZXJpdmVkQm91bmRzLCBkZXJpdmVkTWF0cml4KTtcblxuXHRpZiAoX3Byb3BlcnRpZXMucmVnaXN0cmF0aW9uID09PSBcImNlbnRlclwiKSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubW92ZVJlZ2lzdHJhdGlvbihkZXJpdmVkQ29udGV4dC5ib3VuZHMuY2VudGVyLngsIGRlcml2ZWRDb250ZXh0LmJvdW5kcy5jZW50ZXIueSk7XG5cdH1cblx0aWYgKF9wcm9wZXJ0aWVzLnJlZ2lzdHJhdGlvbiA9PT0gXCJ0b3BcIikge1xuXHRcdGRlcml2ZWRDb250ZXh0Lm1vdmVSZWdpc3RyYXRpb24oZGVyaXZlZENvbnRleHQuYm91bmRzLmNlbnRlci54LCBkZXJpdmVkQ29udGV4dC5ib3VuZHMudG9wKTtcblx0fVxuXHRpZiAoX3Byb3BlcnRpZXMucmVnaXN0cmF0aW9uID09PSBcImJvdHRvbVwiKSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubW92ZVJlZ2lzdHJhdGlvbihkZXJpdmVkQ29udGV4dC5ib3VuZHMuY2VudGVyLngsIGRlcml2ZWRDb250ZXh0LmJvdW5kcy5ib3R0b20pO1xuXHR9XG5cdGlmIChfcHJvcGVydGllcy5yZWdpc3RyYXRpb24gPT09IFwibGVmdFwiKSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubW92ZVJlZ2lzdHJhdGlvbihkZXJpdmVkQ29udGV4dC5ib3VuZHMubGVmdCwgZGVyaXZlZENvbnRleHQuYm91bmRzLmNlbnRlci55KTtcblx0fVxuXHRpZiAoX3Byb3BlcnRpZXMucmVnaXN0cmF0aW9uID09PSBcInJpZ2h0XCIpIHtcblx0XHRkZXJpdmVkQ29udGV4dC5tb3ZlUmVnaXN0cmF0aW9uKGRlcml2ZWRDb250ZXh0LmJvdW5kcy5yaWdodCwgZGVyaXZlZENvbnRleHQuYm91bmRzLmNlbnRlci55KTtcblx0fVxuXHRpZiAoX3Byb3BlcnRpZXMucmVnaXN0cmF0aW9uID09PSBcInRvcF9sZWZ0XCIpIHtcblx0XHRkZXJpdmVkQ29udGV4dC5tb3ZlUmVnaXN0cmF0aW9uKGRlcml2ZWRDb250ZXh0LmJvdW5kcy5sZWZ0LCBkZXJpdmVkQ29udGV4dC5ib3VuZHMudG9wKTtcblx0fVxuXHRpZiAoX3Byb3BlcnRpZXMucmVnaXN0cmF0aW9uID09PSBcInRvcF9yaWdodFwiKSB7XG5cdFx0ZGVyaXZlZENvbnRleHQubW92ZVJlZ2lzdHJhdGlvbihkZXJpdmVkQ29udGV4dC5ib3VuZHMucmlnaHQsIGRlcml2ZWRDb250ZXh0LmJvdW5kcy50b3ApO1xuXHR9XG5cdGlmIChfcHJvcGVydGllcy5yZWdpc3RyYXRpb24gPT09IFwiYm90dG9tX2xlZnRcIikge1xuXHRcdGRlcml2ZWRDb250ZXh0Lm1vdmVSZWdpc3RyYXRpb24oZGVyaXZlZENvbnRleHQuYm91bmRzLmxlZnQsIGRlcml2ZWRDb250ZXh0LmJvdW5kcy5ib3R0b20pO1xuXHR9XG5cdGlmIChfcHJvcGVydGllcy5yZWdpc3RyYXRpb24gPT09IFwiYm90dG9tX3JpZ2h0XCIpIHtcblx0XHRkZXJpdmVkQ29udGV4dC5tb3ZlUmVnaXN0cmF0aW9uKGRlcml2ZWRDb250ZXh0LmJvdW5kcy5yaWdodCwgZGVyaXZlZENvbnRleHQuYm91bmRzLmJvdHRvbSk7XG5cdH1cblx0XG5cdGlmIChfcHJvcGVydGllcy50cmFuc2xhdGVfeCB8fCBfcHJvcGVydGllcy50cmFuc2xhdGVfeSkge1xuXHRcdGRlcml2ZWRDb250ZXh0Lm1hdHJpeC50cmFuc2xhdGUoX3Byb3BlcnRpZXMudHJhbnNsYXRlX3ggfHwgMCwgX3Byb3BlcnRpZXMudHJhbnNsYXRlX3kgfHwgMCk7XG5cdH1cblxuXHRpZiAoX3Byb3BlcnRpZXMucm90YXRpb24pIHtcblx0XHRkZXJpdmVkQ29udGV4dC5tYXRyaXgucm90YXRlKF9wcm9wZXJ0aWVzLnJvdGF0aW9uKTtcblx0fVxuXG5cdGlmIChfcHJvcGVydGllcy5zY2FsZV94IHx8IF9wcm9wZXJ0aWVzLnNjYWxlX3kpIHtcblx0XHRkZXJpdmVkQ29udGV4dC5tYXRyaXguc2NhbGUoX3Byb3BlcnRpZXMuc2NhbGVfeCB8fCAxLCBfcHJvcGVydGllcy5zY2FsZV95IHx8IDEpO1xuXHR9XG5cblxuXHRyZXR1cm4gZGVyaXZlZENvbnRleHQ7XG59O1xuXG5cbkNvbnRleHQucHJvdG90eXBlLm1vdmVSZWdpc3RyYXRpb24gPSBmdW5jdGlvbihfeCwgX3kpIHtcblx0dGhpcy5ib3VuZHMueCAtPSBfeDtcblx0dGhpcy5ib3VuZHMueSAtPSBfeTtcblx0dGhpcy5tYXRyaXgudHJhbnNsYXRlKF94LCBfeSk7XG59O1xuXG5Db250ZXh0LnByb3RvdHlwZS5jZW50ZXJSZWdpc3RyYXRpb24gPSBmdW5jdGlvbigpIHtcblx0dmFyIG9sZENlbnRlciA9IHRoaXMuYm91bmRzLmNlbnRlcjtcblx0dGhpcy5ib3VuZHMueCAtPSBvbGRDZW50ZXIueDtcblx0dGhpcy5ib3VuZHMueSAtPSBvbGRDZW50ZXIueTtcblx0dGhpcy5tYXRyaXgudHJhbnNsYXRlKG9sZENlbnRlcik7XG59O1xuXG5cblxuZnVuY3Rpb24gZGVyaXZlQm91bmQocGFyZW50Qm91bmQsIHBhcmVudE9wcG9zaXRlQm91bmQsIHBvc2l0aW9uUmVsYXRpdmUsIGJvdW5kUmVsYXRpdmUsIG9wcG9zaXRlUG9zaXRpb25SZWxhdGl2ZSwgb3Bwb3NpdGVCb3VuZFJlbGF0aXZlLCBkaW1lbnNpb24sIGRpcmVjdGlvbikge1xuXG5cdGlmICh0eXBlb2YgcG9zaXRpb25SZWxhdGl2ZSA9PT0gXCJudW1iZXJcIikge1xuXHRcdHJldHVybiBwb3NpdGlvblJlbGF0aXZlO1xuXHR9XG5cblx0ZWxzZSBpZiAodHlwZW9mIGJvdW5kUmVsYXRpdmUgPT09IFwibnVtYmVyXCIpIHtcblx0XHRyZXR1cm4gcGFyZW50Qm91bmQgKyBib3VuZFJlbGF0aXZlICogLWRpcmVjdGlvbjtcblx0fVxuXG5cdGVsc2UgaWYgKHR5cGVvZiBvcHBvc2l0ZVBvc2l0aW9uUmVsYXRpdmUgPT09IFwibnVtYmVyXCIgJiYgdHlwZW9mIGRpbWVuc2lvbiA9PT0gXCJudW1iZXJcIikge1xuXHRcdHJldHVybiBvcHBvc2l0ZVBvc2l0aW9uUmVsYXRpdmUgKyBkaW1lbnNpb24gKiBkaXJlY3Rpb247XG5cdH1cblxuXHRlbHNlIGlmICh0eXBlb2Ygb3Bwb3NpdGVCb3VuZFJlbGF0aXZlID09PSBcIm51bWJlclwiICYmIHR5cGVvZiBkaW1lbnNpb24gPT09IFwibnVtYmVyXCIpIHtcblx0XHRyZXR1cm4gKHBhcmVudE9wcG9zaXRlQm91bmQgKyBvcHBvc2l0ZUJvdW5kUmVsYXRpdmUgKiBkaXJlY3Rpb24pICsgZGltZW5zaW9uICogZGlyZWN0aW9uO1xuXHR9XG5cblx0ZWxzZSBpZiAodHlwZW9mIGRpbWVuc2lvbiA9PT0gXCJudW1iZXJcIikge1xuXHRcdHJldHVybiAoZGltZW5zaW9uICogMC41ICogZGlyZWN0aW9uKTtcblx0fVxuXG5cdGVsc2UgaWYgKHR5cGVvZiBvcHBvc2l0ZVBvc2l0aW9uUmVsYXRpdmUgPT09IFwibnVtYmVyXCIpIHtcblx0XHRyZXR1cm4gb3Bwb3NpdGVQb3NpdGlvblJlbGF0aXZlO1xuXHR9XG5cblx0ZWxzZSB7XG5cdFx0cmV0dXJuIHBhcmVudEJvdW5kO1xuXHR9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIGpzWUFNTCA9IHJlcXVpcmUoJ2pzLXlhbWwnKTtcbnZhciBsb2cgPSByZXF1aXJlKCcuL3VpL0xvZy5qcycpLnNoYXJlZEluc3RhbmNlKCk7XG52YXIgbGFuZ3VhZ2UgPSByZXF1aXJlKCcuL2xhbmd1YWdlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzLnBhcnNlID0gcGFyc2U7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFBhcnNlclxuXG5mdW5jdGlvbiBwYXJzZShfeWFtbCkge1xuXHR2YXIgZGF0YTtcblxuXHRsb2cuYXBwZW5kTWVzc2FnZShcIlBhcnNpbmcgWUFNTFwiKTtcblx0XG5cdC8vIHRyeSBmaXJzdCB3aXRob3V0IGluamVjdGlvbnMsIHNvIHRoYXQgZXJyb3JzIHdpbGwgaGF2ZSBjb3JyZWN0IGxpbmUgbnVtYmVyc1xuXHR0cnkge1xuXHRcdGRhdGEgPSBqc1lBTUwuc2FmZUxvYWQoX3lhbWwpO1xuXHR9XG5cdGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIGxvZy5hcHBlbmRQYXJzZUVycm9yKGUpO1xuXHR9XG5cblxuXHRfeWFtbCA9IGluamVjdEVkaXRvclByb3BlcnRpZXMoX3lhbWwpO1xuXG5cdC8vIHBhcnNlIGFnYWluLCBmb3IgcmVhbCB0aGlzIHRpbWVcblx0dHJ5IHtcblx0XHRkYXRhID0ganNZQU1MLnNhZmVMb2FkKF95YW1sKTtcblx0fVxuXHRjYXRjaCAoZSkge1xuXHRcdHJldHVybiBsb2cuYXBwZW5kUGFyc2VFcnJvcihlKTtcblx0fVxuXG5cdGlmIChkYXRhID09PSBudWxsIHx8IHR5cGVvZiBkYXRhICE9PSBcIm9iamVjdFwiKSB7XG5cdFx0cmV0dXJuIGxvZy5hcHBlbmRFcnJvcihcIkNvdWxkbid0IHBhcnNlIFlBTUwuXCIpO1xuXHR9XG5cblx0Ly8gdG9kbyBkZWZhdWx0IGRvY3VtZW50IGdvZXMgaGVyZVxuXHRpZiAoIWRhdGEucHJvcGVydGllcykgZGF0YS5wcm9wZXJ0aWVzID0ge307XG5cblx0cmV0dXJuIGRhdGE7XG59XG5cbmZ1bmN0aW9uIGluamVjdEVkaXRvclByb3BlcnRpZXMoX3lhbWwpIHtcblxuXHR2YXIgbGluZXMgPSBfeWFtbC5zcGxpdChcIlxcblwiKTtcblxuXHR2YXIgcmVnaW9uS2V5d29yZHMgPSBfKGxhbmd1YWdlLnJlZ2lvblR5cGVzKS5wbHVjayhcImtleXdvcmRcIik7XG5cdHJlZ2lvbktleXdvcmRzID0gXyhyZWdpb25LZXl3b3JkcykuZmlsdGVyKCBmdW5jdGlvbihfdmFsdWUpIHtcblx0XHRyZXR1cm4gX3ZhbHVlOyAvLyByZW1vdmUgdW50cnV0aHkgdmFsdWVzXG5cdH0pO1xuXHRyZWdpb25LZXl3b3JkcyA9IFwiKD86XCIgKyByZWdpb25LZXl3b3Jkcy5qb2luKFwifFwiKSArIFwiKVwiO1xuXHQvLyBjb25zb2xlLmxvZyhyZWdpb25LZXl3b3Jkcyk7XG5cdHZhciBtYXBQYXR0ZXJuID0gbmV3IFJlZ0V4cChyZWdpb25LZXl3b3JkcytcIjpcXFxccyokXCIpO1xuXG5cdHZhciBmaXJzdExpbmU7XG5cdHZhciBsYXN0TGluZTtcblxuXHR2YXIgcmFuZ2VzID0gW107XG5cblx0dmFyIGRvY3VtZW50RGF0YSA9IHtcblx0XHRmaXJzdExpbmU6IDAsXG5cdFx0bGFzdExpbmU6IGxpbmVzLmxlbmd0aFxuXHR9O1xuXG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuXG5cdFx0dmFyIGlzVGFyZ2V0ID0gbWFwUGF0dGVybi50ZXN0KGxpbmVzW2ldKTtcblxuXHRcdGlmIChpc1RhcmdldCkge1xuXHRcdFx0dmFyIGluZGVudCA9IFwiICAgIFwiO1xuXHRcdFx0dmFyIHdoaXRlc3BhY2UgPSAvXihcXHMqKS8uZXhlYyhsaW5lc1tpXSlbMV07XG5cblx0XHRcdGZvciAodmFyIGlpID0gaSArIDE7IGlpIDwgbGluZXMubGVuZ3RoOyBpaSsrKSB7XG5cdFx0XHRcdGlmIChsaW5lc1tpaV0udHJpbSgpID09PSAnJykge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChsaW5lc1tpaV0uaW5kZXhPZih3aGl0ZXNwYWNlICsgaW5kZW50KSAhPT0gMCkge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGZpcnN0TGluZSA9IGk7XG5cdFx0XHRsYXN0TGluZSA9IGlpIC0gMTtcblx0XHRcdHJhbmdlcy5wdXNoKHtcblx0XHRcdFx0Zmlyc3RMaW5lOiBmaXJzdExpbmUsXG5cdFx0XHRcdGxhc3RMaW5lOiBsYXN0TGluZSxcblx0XHRcdFx0aW5qZWN0SW5kZW50OiB3aGl0ZXNwYWNlICsgaW5kZW50XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRmb3IgKHZhciByID0gcmFuZ2VzLmxlbmd0aCAtIDE7IHIgPj0gMDsgci0tKSB7XG5cdFx0dmFyIGRhdGEgPSB7XG5cdFx0XHRmaXJzdExpbmU6IHJhbmdlc1tyXS5maXJzdExpbmUsXG5cdFx0XHRsYXN0TGluZTogcmFuZ2VzW3JdLmxhc3RMaW5lXG5cdFx0fTtcblx0XHR2YXIgaW5qZWN0aW9uID0gcmFuZ2VzW3JdLmluamVjdEluZGVudCArIFwiZWRpdG9yX3Byb3BlcnRpZXM6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG5cdFx0bGluZXMuc3BsaWNlKHJhbmdlc1tyXS5maXJzdExpbmUgKyAxLCAwLCBpbmplY3Rpb24pO1xuXHR9XG5cblxuXHRsaW5lcy5zcGxpY2UoMCwgMCwgXCJlZGl0b3JfcHJvcGVydGllczogXCIgKyBKU09OLnN0cmluZ2lmeShkb2N1bWVudERhdGEpKTtcblxuXHQvLyBjb25zb2xlLmxvZyhsaW5lcy5qb2luKFwiXFxuXCIpKTtcblxuXHRyZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcblxuXG59XG5cbiIsInJlcXVpcmUoJy4vanF1ZXJ5X3V0aWwuanMnKTtcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIE11c3RhY2hlID0gcmVxdWlyZSgnbXVzdGFjaGUnKTtcbnZhciBsYW5ndWFnZSA9IHJlcXVpcmUoJy4vbGFuZ3VhZ2UuanMnKTtcbnZhciBQcmV2aWV3ID0gcmVxdWlyZSgnLi91aS9QcmV2aWV3LmpzJyk7XG52YXIgcmVnaW9uVHlwZXMgPSByZXF1aXJlKCcuL3JlZ2lvbi9yZWdpb25UeXBlcy5qcycpO1xudmFyIFBhcnNlciA9IHJlcXVpcmUoJy4vUGFyc2VyLmpzJyk7XG5cbmZ1bmN0aW9uIHBvcHVsYXRlVGVtcGxhdGVzKCkge1xuXHQvLyBwcmVwYXJlIGRhdGFcblx0dmFyIGRhdGEgPSB7fTtcblxuXHRkYXRhLnJlZ2lvblR5cGVzID0gXyhsYW5ndWFnZS5yZWdpb25UeXBlcykudmFsdWVzKCk7XG5cdF8oZGF0YS5yZWdpb25UeXBlcykuZWFjaChmdW5jdGlvbih0eXBlKXtcblx0XHR0eXBlLnJlcXVpcmVkX3Byb3BlcnRpZXMgPSBfKHR5cGUucHJvcGVydGllcykuZmlsdGVyKCBmdW5jdGlvbihwcm9wKSB7XG5cdFx0XHRyZXR1cm4gcHJvcC5yZXF1aXJlZCAmJiBwcm9wLnJlcXVpcmVkID09PSB0cnVlO1xuXHRcdH0pO1xuXHRcdFxuXHRcdHR5cGUucHJvcGVydGllcyA9IF8odHlwZS5wcm9wZXJ0aWVzKS5kaWZmZXJlbmNlKHR5cGUucmVxdWlyZWRfcHJvcGVydGllcyk7XG5cdFx0XHRcblx0XHRpZiAodHlwZS5leHRlbmRzICYmIGxhbmd1YWdlLnJlZ2lvblR5cGVzW3R5cGUuZXh0ZW5kc10pIHtcblx0XHRcdHR5cGUuaW5oZXJpdGVkX3Byb3BlcnRpZXMgPSBsYW5ndWFnZS5yZWdpb25UeXBlc1t0eXBlLmV4dGVuZHNdLnByb3BlcnRpZXM7XG5cdFx0fVxuXHR9KTtcblxuXG5cdHZhciBtZW51VGVtcGxhdGUgPSAkKCcjdGVtcGxhdGUtbWVudScpLmh0bWwoKTtcblx0TXVzdGFjaGUucGFyc2UobWVudVRlbXBsYXRlKTsgLy8gb3B0aW9uYWwsIHNwZWVkcyB1cCBmdXR1cmUgdXNlc1xuXHR2YXIgbWVudVJlbmRlcmVkID0gTXVzdGFjaGUucmVuZGVyKG1lbnVUZW1wbGF0ZSwgZGF0YSk7XG5cdCQoJyN0ZW1wbGF0ZS1tZW51JykuaHRtbChtZW51UmVuZGVyZWQpO1xuXG5cblx0dmFyIHRlbXBsYXRlID0gJCgnI3RlbXBsYXRlLXJlZ2lvblR5cGVzJykuaHRtbCgpLnJlcGxhY2UoLyZndDsvZywgXCI+XCIpO1xuXHR2YXIgcHJvcGVydHlUZW1wbGF0ZSA9ICQoJyN0ZW1wbGF0ZS1wcm9wZXJ0eScpLmh0bWwoKTtcblx0dmFyIHJlbmRlcmVkID0gTXVzdGFjaGUudG9faHRtbCh0ZW1wbGF0ZSwgZGF0YSwge3Byb3A6IHByb3BlcnR5VGVtcGxhdGV9KTtcblx0JCgnI3RlbXBsYXRlLXJlZ2lvblR5cGVzJykuaHRtbChyZW5kZXJlZCk7XG5cblxuXHQvL2VuYWJsZSBwcm9wZXJ0eSBjbGlja2luZ1xuXG5cdC8vY2xvc2UgaW5oZXJldGlkIHByb3BlcnRpZXNcblx0JChcIi5wcm9wZXJ0aWVzLmluaGVyaXRlZC1wcm9wZXJ0aWVzIGxpXCIpLmFkZENsYXNzKFwiY2xvc2VkXCIpO1xuXG5cdC8vbWFrZSBwcm9wZXJ0aWVzIGNsaWNrYWJsZVxuXHQkKFwiLnByb3BlcnR5LW5hbWVcIikuY3NzKFwiY3Vyc29yXCIsIFwicG9pbnRlclwiKTtcblx0JChcIi5wcm9wZXJ0eS1uYW1lXCIpLmNsaWNrKFxuXHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0JCh0aGlzKS5wYXJlbnQoKS50b2dnbGVDbGFzcyhcImNsb3NlZFwiKTtcblx0XHR9XG5cdCk7XG59XG5cblxuZnVuY3Rpb24gcmVuZGVyRXhhbXBsZXMoKSB7XG5cdCQoJ3ByZScpLmVhY2goIGZ1bmN0aW9uKF9pbmRleCwgX2VsZW1lbnQpIHtcblx0XHR2YXIgc291cmNlID0gJChfZWxlbWVudCkudGV4dCgpO1xuXHRcdC8vIGNvbnNvbGUubG9nKFwic291cmNlXCIsIHNvdXJjZSk7XG5cdFx0dmFyIGRhdGEgPSBQYXJzZXIucGFyc2Uoc291cmNlKTtcblx0XHRpZiAoIWRhdGEpIHJldHVybjtcblxuXHRcdHZhciBkb2MgPSBuZXcgcmVnaW9uVHlwZXMuRG9jdW1lbnQoKTtcblx0XHRkb2MubG9hZERhdGEoZGF0YSk7XG5cdFx0Ly8gY29uc29sZS5sb2coXCJkb2NcIiwgZGF0YSwgZG9jLnByb3BlcnRpZXMpO1xuXHRcdGRvYy5wcm9wZXJ0aWVzLmxlZnQgPSAwO1xuXHRcdGRvYy5wcm9wZXJ0aWVzLnRvcCA9IDA7XG5cdFx0ZG9jLnByb3BlcnRpZXMud2lkdGggPSBkYXRhLnByb3BlcnRpZXMud2lkdGggfHwgNTI1O1xuXHRcdGRvYy5wcm9wZXJ0aWVzLmhlaWdodCA9IGRhdGEucHJvcGVydGllcy5oZWlnaHQgfHwgMjI1O1xuXHRcdGRvYy5wcm9wZXJ0aWVzLnJlZ2lzdHJhdGlvbiA9IFwiY2VudGVyXCI7XG5cblxuXHRcdHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcz5cIilcblx0XHRcdC5hZGRDbGFzcyhcImV4YW1wbGVcIilcblx0XHRcdC5hdHRyKFwiaWRcIiwgXCJleGFtcGxlLVwiK19pbmRleClcblx0XHRcdC5hdHRyKFwid2lkdGhcIiwgZG9jLnByb3BlcnRpZXMud2lkdGggKyAyNSlcblx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIGRvYy5wcm9wZXJ0aWVzLmhlaWdodCArIDI1KTtcblxuXG5cdFx0dmFyIHByZXZpZXcgPSBuZXcgUHJldmlldygpO1xuXHRcdHByZXZpZXcuaW5pdChjYW52YXMuZ2V0KDApKTtcblxuXHRcdC8vIFVJLnByZXZpZXcuaW5pdCgkKCcjcGFwZXItY2FudmFzJykuZ2V0KDApKTtcblx0XHRwcmV2aWV3LnNldERvY3VtZW50KGRvYyk7XG5cblxuXHRcdGNhbnZhcy5pbnNlcnRCZWZvcmUoX2VsZW1lbnQpO1xuXHR9KTtcblxuXHRcblxuXG5cdCQoJ3ByZScpLmFkZENsYXNzKCdwcmV0dHlwcmludCcpO1xuXHRwcmV0dHlQcmludCgpO1xufVxuXG4kKGZ1bmN0aW9uKCkge1xuXG5cdFxuXHRwb3B1bGF0ZVRlbXBsYXRlcygpO1xuXHRyZW5kZXJFeGFtcGxlcygpO1xuXG5cdFxuXG5cblx0XG59KTtcbiIsInZhciB0b3BpY3MgPSB7fTtcblxuXG5qUXVlcnkuVG9waWMgPSBmdW5jdGlvbiggaWQgKSB7XG4gICAgdmFyIGNhbGxiYWNrcyxcbiAgICAgICAgdG9waWMgPSBpZCAmJiB0b3BpY3NbIGlkIF07XG4gICAgaWYgKCAhdG9waWMgKSB7XG4gICAgICAgIGNhbGxiYWNrcyA9IGpRdWVyeS5DYWxsYmFja3MoKTtcbiAgICAgICAgdG9waWMgPSB7XG4gICAgICAgICAgICBwdWJsaXNoOiBjYWxsYmFja3MuZmlyZSxcbiAgICAgICAgICAgIHN1YnNjcmliZTogY2FsbGJhY2tzLmFkZCxcbiAgICAgICAgICAgIHVuc3Vic2NyaWJlOiBjYWxsYmFja3MucmVtb3ZlXG4gICAgICAgIH07XG4gICAgICAgIGlmICggaWQgKSB7XG4gICAgICAgICAgICB0b3BpY3NbIGlkIF0gPSB0b3BpYztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG9waWM7XG59O1xuLy8gVG9waWMgY3JlYXRlcyBhIGdsb2JhbCBwdWIvc3ViIGRpc3BhdGNoZXIuIENvZGUganF1ZXJ5IGRvY3VtZW50YXRpb25cbi8vIGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuQ2FsbGJhY2tzL1xuLy8gZXhhbXBsZSB1c2FnZTpcbi8vICQuVG9waWMoIFwibWFpbEFycml2ZWRcIiApLnN1YnNjcmliZSggZm4xICk7XG4vLyAkLlRvcGljKCBcIm1haWxBcnJpdmVkXCIgKS5wdWJsaXNoKCBcImhlbGxvIHdvcmxkIVwiICk7XG5cblxuXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzYyNTkzMDEvanF1ZXJ5LWRlZmVycmVkLXR1cm4tZmFpbHVyZS1pbnRvLXN1Y2Nlc3Ncbi8vIGh0dHA6Ly9qc2ZpZGRsZS5uZXQvSW5maW5pdGllc0xvb3AveVFzWUsvXG5qUXVlcnkud2hlbkFsbCA9IGZ1bmN0aW9uKCBmaXJzdFBhcmFtICkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICBzbGljZURlZmVycmVkID0gW10uc2xpY2UsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBsZW5ndGggPSBhcmdzLmxlbmd0aCxcbiAgICAgICAgY291bnQgPSBsZW5ndGgsXG4gICAgICAgIHJlamVjdGVkLFxuICAgICAgICBkZWZlcnJlZCA9IGxlbmd0aCA8PSAxICYmIGZpcnN0UGFyYW0gJiYgalF1ZXJ5LmlzRnVuY3Rpb24oIGZpcnN0UGFyYW0ucHJvbWlzZSApID8gZmlyc3RQYXJhbSA6IGpRdWVyeS5EZWZlcnJlZCgpO1xuICAgIFxuICAgIGZ1bmN0aW9uIHJlc29sdmVGdW5jKCBpLCByZWplY3QgKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgICAgICByZWplY3RlZCA9IHRydWU7XG4gICAgICAgICAgICBhcmdzWyBpIF0gPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IHNsaWNlRGVmZXJyZWQuY2FsbCggYXJndW1lbnRzLCAwICkgOiB2YWx1ZTtcbiAgICAgICAgICAgIGlmICggISggLS1jb3VudCApICkge1xuICAgICAgICAgICAgICAgIC8vIFN0cmFuZ2UgYnVnIGluIEZGNDpcbiAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgY2hhbmdlZCBvbnRvIHRoZSBhcmd1bWVudHMgb2JqZWN0IHNvbWV0aW1lcyBlbmQgdXAgYXMgdW5kZWZpbmVkIHZhbHVlc1xuICAgICAgICAgICAgICAgIC8vIG91dHNpZGUgdGhlICQud2hlbiBtZXRob2QuIENsb25pbmcgdGhlIG9iamVjdCBpbnRvIGEgZnJlc2ggYXJyYXkgc29sdmVzIHRoZSBpc3N1ZVxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHJlamVjdGVkID8gZGVmZXJyZWQucmVqZWN0V2l0aCA6IGRlZmVycmVkLnJlc29sdmVXaXRoO1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoZGVmZXJyZWQsIGRlZmVycmVkLCBzbGljZURlZmVycmVkLmNhbGwoIGFyZ3MsIDAgKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIGlmICggbGVuZ3RoID4gMSApIHtcbiAgICAgICAgZm9yKCA7IGkgPCBsZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgIGlmICggYXJnc1sgaSBdICYmIGpRdWVyeS5pc0Z1bmN0aW9uKCBhcmdzWyBpIF0ucHJvbWlzZSApICkge1xuICAgICAgICAgICAgICAgIGFyZ3NbIGkgXS5wcm9taXNlKCkudGhlbiggcmVzb2x2ZUZ1bmMoaSksIHJlc29sdmVGdW5jKGksIHRydWUpICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC0tY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCAhY291bnQgKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlV2l0aCggZGVmZXJyZWQsIGFyZ3MgKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIGRlZmVycmVkICE9PSBmaXJzdFBhcmFtICkge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlV2l0aCggZGVmZXJyZWQsIGxlbmd0aCA/IFsgZmlyc3RQYXJhbSBdIDogW10gKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbn07XG5cblxuXG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGdsb2JhbCByZWdpb25UeXBlcyAqL1xuLy8gcmVxdWlyZXNcblxubW9kdWxlLmV4cG9ydHMucmVnaW9uVHlwZXMgPSByZWdpb25UeXBlcztcbm1vZHVsZS5leHBvcnRzLnVuaXRTY2FsZXMgPSB7XG5cdFwicHhcIjogMSxcblx0XCJpblwiOiA3Mixcblx0XCJmdFwiOiA3MioxMixcblx0XCJtbVwiOiAyLjgzNDY0NTY3LFxuXHRcImNtXCI6IDI4LjM0NjQ1NjcsXG5cdFwibVwiOiAyODM0LjY0NTY3XG59O1xuIiwiXG4vLyB0YWtlcyBhbiBhcnJheSBvZiBfcGF0aHMgYW5kIGNvbWJpbmVzIHRoZSBmaXJzdCBpdGVtIHdpdGggYWxsIHJlbWFpbmluZyBpdGVtcyB1c2luZyB0aGUgYm9vbGVhbiBfb3BlcmF0aW9uIFxuXG4vLyBtb2R1bGUuZXhwb3J0cy5jb21iaW5lUGF0aHMgPSBmdW5jdGlvbihfcGF0aHMsIF9vcGVyYXRpb24pIHtcbi8vIFx0aWYgKF9wYXRocy5sZW5ndGggPCAxKSByZXR1cm4gW107XG5cblx0XG4vLyBcdHZhciBuZXdQYXRoID0gX3BhdGhzWzBdO1xuLy8gXHRmb3IgKHZhciBpID0gMTsgaSA8IF9wYXRocy5sZW5ndGg7IGkrKykge1xuLy8gXHRcdG5ld1BhdGgucmVtb3ZlKCk7XG4vLyBcdFx0X3BhdGhzW2ldLnJlbW92ZSgpO1xuLy8gXHRcdG5ld1BhdGggPSBuZXdQYXRoW19vcGVyYXRpb25dKF9wYXRoc1tpXSk7XG4vLyBcdH1cblxuLy8gXHRyZXR1cm4gbmV3UGF0aDtcbi8vIH07XG5cbm1vZHVsZS5leHBvcnRzLm5ld0NvbWJpbmVQYXRocyA9IGZ1bmN0aW9uKF9iYXNlUGF0aCwgX3BhdGhzLCBfb3BlcmF0aW9uKXtcblx0aWYgKF9wYXRocy5sZW5ndGggPCAxKSByZXR1cm4gW19iYXNlUGF0aF07XG5cblx0X3Jlc3VsdFBhdGggPSBfYmFzZVBhdGg7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgX3BhdGhzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKCEoX3BhdGhzW2ldIGluc3RhbmNlb2YgcGFwZXIuUGF0aCkpIGNvbnRpbnVlO1xuXG5cdFx0X3Jlc3VsdFBhdGgucmVtb3ZlKCk7XG5cdFx0X3BhdGhzW2ldLnJlbW92ZSgpO1xuXHRcdF9yZXN1bHRQYXRoID0gX3Jlc3VsdFBhdGhbX29wZXJhdGlvbl0oX3BhdGhzW2ldKTtcblx0fVxuXG5cdHJldHVybiBfcmVzdWx0UGF0aDtcblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJlZ2lvbiA9IHJlcXVpcmUoJy4vUmVnaW9uLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEb2N1bWVudDtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gRG9jdW1lbnRcblxuZnVuY3Rpb24gRG9jdW1lbnQoX2RhdGEsIF9wYXJlbnQpIHtcblx0UmVnaW9uLmNhbGwodGhpcywgX2RhdGEsIF9wYXJlbnQpO1xuXHR0aGlzLnR5cGUgPSBcIkRvY3VtZW50XCI7XG5cdHRoaXMud2FpdExpc3QgPSBbXTtcbn1cblxuRG9jdW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWdpb24ucHJvdG90eXBlKTtcbkRvY3VtZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERvY3VtZW50O1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xudmFyIFJlZ2lvbiA9IHJlcXVpcmUoJy4vUmVnaW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWxsaXBzZTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gRWxsaXBzZVxuXG5mdW5jdGlvbiBFbGxpcHNlKF9kYXRhLCBfcGFyZW50KSB7XG5cdFJlZ2lvbi5jYWxsKHRoaXMsIF9kYXRhLCBfcGFyZW50KTtcblx0dGhpcy50eXBlID0gXCJFbGxpcHNlXCI7XG5cdHRoaXMuaXNTaGFwZSA9IHRydWU7XG59XG5cbkVsbGlwc2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWdpb24ucHJvdG90eXBlKTtcbkVsbGlwc2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRWxsaXBzZTtcblxuRWxsaXBzZS5wcm90b3R5cGUuZHJhd0J1aWxkID0gZnVuY3Rpb24oX2JvdW5kcykge1xuXHR2YXIgYm91bmRzUGF0aCA9IG5ldyBwYXBlci5QYXRoLkVsbGlwc2UoX2JvdW5kcyk7XG5cdHJldHVybiBib3VuZHNQYXRoO1xufTtcblxuXG5FbGxpcHNlLnByb3RvdHlwZS5kcmF3Qm91bmRzID0gZnVuY3Rpb24oX2JvdW5kcykge1xuXHRyZXR1cm4gbmV3IHBhcGVyLlBhdGguRWxsaXBzZShfYm91bmRzKTtcbn07XG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciBSZWdpb24gPSByZXF1aXJlKCcuL1JlZ2lvbi5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3RhbmdsZTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gUmVjdGFuZ2xlXG5cbmZ1bmN0aW9uIFJlY3RhbmdsZShfZGF0YSwgX3BhcmVudCkge1xuXHRSZWdpb24uY2FsbCh0aGlzLCBfZGF0YSwgX3BhcmVudCk7XG5cdHRoaXMudHlwZSA9IFwiUmVjdGFuZ2xlXCI7XG5cdHRoaXMuaXNTaGFwZSA9IHRydWU7XG59XG5cblJlY3RhbmdsZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlZ2lvbi5wcm90b3R5cGUpO1xuUmVjdGFuZ2xlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlY3RhbmdsZTtcblxuUmVjdGFuZ2xlLnByb3RvdHlwZS5kcmF3QnVpbGQgPSBmdW5jdGlvbihfYm91bmRzKSB7XG5cdHZhciBib3VuZHNQYXRoID0gbmV3IHBhcGVyLlBhdGguUmVjdGFuZ2xlKF9ib3VuZHMsIHRoaXMucHJvcGVydGllcy5yYWRpdXMgfHwgMCk7XG5cdHJldHVybiBib3VuZHNQYXRoO1xufTtcblxuUmVjdGFuZ2xlLnByb3RvdHlwZS5kcmF3Qm91bmRzID0gZnVuY3Rpb24oX2JvdW5kcykge1xuXHRyZXR1cm4gbmV3IHBhcGVyLlBhdGguUmVjdGFuZ2xlKF9ib3VuZHMsIHRoaXMucHJvcGVydGllcy5yYWRpdXMgfHwgMCk7XG59O1xuXG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgcGFwZXJVdGlsID0gcmVxdWlyZSgnLi4vcGFwZXJfdXRpbC5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi9zZXR0aW5ncy5qcycpO1xudmFyIHJlZ2lvblR5cGVzID0gcmVxdWlyZSgnLi9yZWdpb25UeXBlcy5qcycpO1xudmFyIENvbnRleHQgPSByZXF1aXJlKCcuLi9Db250ZXh0LmpzJyk7XG5cbnZhciBsYW5ndWFnZSA9IHJlcXVpcmUoJy4uL2xhbmd1YWdlLmpzJyk7XG52YXIgbG9nID0gcmVxdWlyZSgnLi4vdWkvTG9nLmpzJykuc2hhcmVkSW5zdGFuY2UoKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlZ2lvbjtcblxuXG5cbi8vIHRvZG8gbW92ZSB0aGlzXG4vLyBtYXBzIHRoZSBhbGxvd2VkIHlhbWwgbmFtZSB0byB0aGUgY29yZXNwb25kaW5nIHBhcGVyanMgZnVuY3Rpb25cbnZhciBib29sZWFuT3BlcmF0aW9ucyA9IHtcblx0XCJhZGRcIjogXCJ1bml0ZVwiLFxuXHRcInN1YnRyYWN0XCI6IFwic3VidHJhY3RcIixcblx0XCJpbnRlcnNlY3RcIjogXCJpbnRlcnNlY3RcIlxufTtcblxuXG5cbmZ1bmN0aW9uIFJlZ2lvbihfcGFyZW50KSB7XG5cdHRoaXMudHlwZSA9IFwiUmVnaW9uXCI7XG5cdHRoaXMucGFyZW50ID0gX3BhcmVudCB8fCBudWxsO1xuXHR0aGlzLnJvb3QgPSB0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC5yb290IHx8IHRoaXM7XG5cblx0dGhpcy5jaGlsZHJlbiA9IFtdO1xuXHR0aGlzLnByb3BlcnRpZXMgPSB7fTtcblxuXHR0aGlzLmVkaXRvclByb3BlcnRpZXMgPSB7fTtcblxuXHR0aGlzLnByZXZpZXdCb3VuZHNHcm91cCA9IG51bGw7XG5cdHRoaXMucHJldmlld1Bvc2l0aW9uR3JvdXAgPSBudWxsO1xuXG5cdHRoaXMuaXNTaGFwZSA9IGZhbHNlO1xufVxuXG5SZWdpb24ucHJvdG90eXBlLnByb3h5ID0gZnVuY3Rpb24oKSB7XG5cdC8vIHZhciBwcm94eSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKCk7XG5cdC8vIHByb3h5LnBhcmVudCA9IHRoaXMucGFyZW50O1xuXHQvLyBwcm94eS5yb290ID0gdGhpcy5yb290O1xuXHQvLyBwcm94eS5cblx0dmFyIHByb3h5ID0gT2JqZWN0LmNyZWF0ZSh0aGlzKTtcblx0Ly8gcHJveHkucHJldmlld0JvdW5kc0dyb3VwID0gbnVsbDtcblx0cmV0dXJuIHByb3h5O1xufTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBMb2FkaW5nXG5cblJlZ2lvbi5wcm90b3R5cGUubG9hZERhdGEgPSBmdW5jdGlvbihfZGF0YSkge1xuXG5cdGlmICh0eXBlb2YgX2RhdGEuZWRpdG9yX3Byb3BlcnRpZXMgPT09IFwib2JqZWN0XCIgJiYgX2RhdGEuZWRpdG9yX3Byb3BlcnRpZXMgIT09IG51bGwpIHtcblx0XHR0aGlzLmVkaXRvclByb3BlcnRpZXMgPSBfLmNsb25lKF9kYXRhLmVkaXRvcl9wcm9wZXJ0aWVzKTtcblx0fVxuXG5cdC8vIGlmICh0eXBlb2YgX2RhdGEucHJvcGVydGllcyA9PT0gXCJvYmplY3RcIiAmJiBfZGF0YS5wcm9wZXJ0aWVzICE9PSBudWxsKSB7XG5cdHRoaXMubG9hZFByb3BlcnRpZXMoX2RhdGEucHJvcGVydGllcyk7XG5cdC8vIH1cblxuXHRpZiAodHlwZW9mIF9kYXRhLmNoaWxkcmVuID09PSBcIm9iamVjdFwiICYmIF9kYXRhLmNoaWxkcmVuICE9PSBudWxsKSB7XG5cdFx0dGhpcy5sb2FkQ2hpbGRyZW4oX2RhdGEuY2hpbGRyZW4pO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5cblJlZ2lvbi5wcm90b3R5cGUubG9hZFByb3BlcnRpZXMgPSBmdW5jdGlvbihfcHJvcGVydGllcykge1xuXG5cdHZhciBzZWxmID0gdGhpcztcblx0Ly90b2RvIHJlY3Vyc2U/XG5cdHZhciBkZWZpbml0aW9ucyA9IGxhbmd1YWdlLnJlZ2lvblR5cGVzW3RoaXMudHlwZV0ucHJvcGVydGllcztcblx0aWYgKCFBcnJheS5pc0FycmF5KGRlZmluaXRpb25zKSkge1xuXHRcdGRlZmluaXRpb25zID0gW107XG5cdH1cblx0dmFyIHN1cGVyQ2xhc3MgPSBsYW5ndWFnZS5yZWdpb25UeXBlc1t0aGlzLnR5cGVdLmV4dGVuZHM7XG5cdGlmIChzdXBlckNsYXNzKSB7XG5cdFx0ZGVmaW5pdGlvbnMgPSB1dGlsLm1lcmdlT2JqZWN0QXJyYXlzT25LZXkobGFuZ3VhZ2UucmVnaW9uVHlwZXNbc3VwZXJDbGFzc10ucHJvcGVydGllcywgZGVmaW5pdGlvbnMsIFwia2V5d29yZFwiKTtcblx0fVxuXG5cblxuXHQvLyBCdWlsZCBtZXNzYWdlIHByZWZpeFxuXHQvLyB0b2RvIGZhY3RvciB0aGlzIG91dFxuXHR2YXIgbWVzc2FnZVByZWZpeCA9IHRoaXMudHlwZSArIFwiOiBcIjtcblx0aWYgKHRoaXMuZWRpdG9yUHJvcGVydGllcy5maXJzdExpbmUpIHtcblx0XHRtZXNzYWdlUHJlZml4ID0gXCJbTGluZSBcIiArIHRoaXMuZWRpdG9yUHJvcGVydGllcy5maXJzdExpbmUgKyBcIiBcIiArIHRoaXMudHlwZSArIFwiXSBcIjtcblx0fVxuXG5cblx0aWYgKHR5cGVvZiBfcHJvcGVydGllcyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRfcHJvcGVydGllcyA9IHt9O1xuXHR9XG5cdGlmICh0eXBlb2YgX3Byb3BlcnRpZXMgIT09ICdvYmplY3QnKSB7XG5cdFx0bG9nLmFwcGVuZFdhcm5pbmcobWVzc2FnZVByZWZpeCArIFwiUHJvcGVydGllcyBzaG91bGQgYmUgYSBrZXkvdmFsdWUgbWFwLiBcIiArXG5cdFx0XHRcIjxiciAvPlJlY2VpdmVkIFwiICsgdHlwZW9mIF9wcm9wZXJ0aWVzICsgXCIuXCIpO1xuXHRcdF9wcm9wZXJ0aWVzID0ge307XG5cdH1cblxuXG5cblx0Ly8gVmFsaWRhdGUgYW5kIGltcG9ydCBwcm92aWRlZCBwcm9wZXJ0aWVzLlxuXHRfKF9wcm9wZXJ0aWVzKS5lYWNoKGZ1bmN0aW9uKHBWYWx1ZSwgcEtleSkge1xuXHRcdHZhciBkZWYgPSBfKGRlZmluaXRpb25zKS5maW5kKGZ1bmN0aW9uKF9kZWYpIHtcblx0XHRcdHJldHVybiBfZGVmLmtleXdvcmQgPT09IHBLZXk7XG5cdFx0fSk7XG5cblx0XHRpZiAoIWRlZikge1xuXHRcdFx0bG9nLmFwcGVuZFdhcm5pbmcobWVzc2FnZVByZWZpeCArIFwiVW5rbm93biBwcm9wZXJ0eTogXCIgKyBwS2V5KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHBWYWx1ZSA9PSBcInN0cmluZ1wiICYmIGRlZi50eXBlID09IFwibnVtYmVyXCIgJiYgIWlzTmFOKHBWYWx1ZSkgJiYgcFZhbHVlICE9PSAnJykge1xuXHRcdFx0Ly8gdHJ5IGNhc3Rpbmcgc3RyaW5ncyB0byBudW1iZXJzXG5cdFx0XHRwVmFsdWUgPSBOdW1iZXIocFZhbHVlKTtcblxuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcFZhbHVlICE9PSBkZWYudHlwZSkge1xuXHRcdFx0bG9nLmFwcGVuZFdhcm5pbmcobWVzc2FnZVByZWZpeCArIFwiSW5jb3JyZWN0IHR5cGU6IFwiICsgcEtleSArIFwiPGJyIC8+UmVjZWl2ZWQgXCIgKyB0eXBlb2YgcFZhbHVlICsgXCIuIEV4cGVjdGVkIFwiICsgZGVmLnR5cGUgKyBcIi5cIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGRlZi52YWx1ZXMgJiYgIV8oZGVmLnZhbHVlcykuY29udGFpbnMocFZhbHVlKSkge1xuXHRcdFx0bG9nLmFwcGVuZFdhcm5pbmcobWVzc2FnZVByZWZpeCArIFwiVW5yZWNvZ25pemVkIHZhbHVlIGZvciBwcm9wZXJ0eTogXCIgKyBwS2V5ICsgXCI8YnIgLz5SZWNlaXZlZCBcXFwiXCIgKyBwVmFsdWUgKyBcIlxcXCIuIEV4cGVjdGVkIFwiICsgZGVmLnZhbHVlcy5qb2luKFwiLCBcIikgKyBcIi5cIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0c2VsZi5wcm9wZXJ0aWVzW3BLZXldID0gcFZhbHVlO1xuXHR9KTtcblxuXG5cdC8vIFBvcHVsYXRlIGRlZmF1bHRzXG5cblx0XyhkZWZpbml0aW9ucykuY2hhaW4oKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24oX2RlZikge1xuXHRcdFx0cmV0dXJuIF9kZWYgJiYgX2RlZi5kZWZhdWx0O1xuXHRcdH0pXG5cdFx0LmVhY2goZnVuY3Rpb24oX2RlZikge1xuXHRcdFx0c2VsZi5wcm9wZXJ0aWVzW19kZWYua2V5d29yZF0gPSBzZWxmLnByb3BlcnRpZXNbX2RlZi5rZXl3b3JkXSB8fCBfZGVmLmRlZmF1bHQ7XG5cdFx0fSk7XG5cblxuXHQvLyBFbmZvcmNlIHJlcXVpcmVkXG5cdF8oZGVmaW5pdGlvbnMpLmNoYWluKClcblx0XHQuZmlsdGVyKGZ1bmN0aW9uKF9kZWYpIHtcblx0XHRcdHJldHVybiBfZGVmICYmIF9kZWYucmVxdWlyZWQgPT09IHRydWU7XG5cdFx0fSlcblx0XHQuZWFjaChmdW5jdGlvbihfZGVmKSB7XG5cdFx0XHRpZiAoc2VsZi5wcm9wZXJ0aWVzW19kZWYua2V5d29yZF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsb2cuYXBwZW5kV2FybmluZyhcblx0XHRcdFx0XHRtZXNzYWdlUHJlZml4ICsgXCJNaXNzaW5nIHJlcXVpcmVkIHByb3BlcnR5OiBcIiArIF9kZWYua2V5d29yZFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG59O1xuXG5SZWdpb24ucHJvdG90eXBlLmxvYWRDaGlsZHJlbiA9IGZ1bmN0aW9uKF9jaGlsZHJlbkRhdGEpIHtcblx0aWYgKCEoX2NoaWxkcmVuRGF0YSBpbnN0YW5jZW9mIEFycmF5KSkge1xuXHRcdGxvZy5hcHBlbmRXYXJuaW5nKFwiQ2hpbGRyZW4gc2hvdWxkIGJlIGFuIGFycmF5LiBQcmVwZW5kIGNoaWxkIG5vZGVzIHdpdGggYSBkYXNoIGFuZCBzcGFjZS5cIik7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdF8uZWFjaChfY2hpbGRyZW5EYXRhLCBmdW5jdGlvbihfY2hpbGREYXRhKSB7XG5cdFx0dmFyIGNoaWxkS2V5ID0gXy5rZXlzKF9jaGlsZERhdGEpWzBdO1xuXHRcdHZhciBjaGlsZERhdGEgPSBfLnZhbHVlcyhfY2hpbGREYXRhKVswXTtcblx0XHRpZiAodHlwZW9mIGNoaWxkS2V5ID09PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBjaGlsZERhdGEgPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdGxvZy5hcHBlbmRXYXJuaW5nKFwiVW5kZWZpbmVkIENoaWxkXCIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBkZWYgPSBfKGxhbmd1YWdlLnJlZ2lvblR5cGVzKS5maW5kKGZ1bmN0aW9uKF9kZWYpIHtcblx0XHRcdHJldHVybiBfZGVmLmtleXdvcmQgPT09IGNoaWxkS2V5O1xuXHRcdH0pO1xuXHRcdHZhciB0YXJnZXRDbGFzcyA9IGRlZiAmJiBkZWYuY2xhc3M7XG5cblxuXHRcdGlmICh0YXJnZXRDbGFzcyAmJiB0YXJnZXRDbGFzcyBpbiByZWdpb25UeXBlcykge1xuXHRcdFx0dmFyIGNoaWxkID0gbmV3KHJlZ2lvblR5cGVzW3RhcmdldENsYXNzXSkodGhpcyk7XG5cdFx0XHRjaGlsZC5sb2FkRGF0YShjaGlsZERhdGEpO1xuXHRcdFx0dGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoY2hpbGREYXRhLmVkaXRvcl9wcm9wZXJ0aWVzKSB7XG5cdFx0XHRcdGxvZy5hcHBlbmRXYXJuaW5nKFwiW0xpbmUgXCIgKyBjaGlsZERhdGEuZWRpdG9yX3Byb3BlcnRpZXMuZmlyc3RMaW5lICsgXCJdIFVua25vd24gcmVnaW9uIHR5cGU6IFwiICsgY2hpbGRLZXkpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGxvZy5hcHBlbmRXYXJuaW5nKFwiVW5rbm93biByZWdpb24gdHlwZTogXCIgKyBjaGlsZEtleSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH0sIHRoaXMpO1xufTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBVdGlsXG5cblJlZ2lvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0dmFyIHMgPSB0aGlzLnR5cGU7XG5cdGlmICh0aGlzLmVkaXRvclByb3BlcnRpZXMubGluZSkge1xuXHRcdHMgKz0gXCIoXCIgKyB0aGlzLmVkaXRvclByb3BlcnRpZXMubGluZSArIFwiKVwiO1xuXHR9XG5cdHMgKz0gXCI6IFwiO1xuXHRzICs9IHRoaXMucHJvcGVydGllcy5uYW1lIHx8IFwidW5uYW1lZFwiO1xuXHRyZXR1cm4gcztcbn07XG5cblJlZ2lvbi5wcm90b3R5cGUuYnJlYWRDcnVtYiA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgYmMgPSBbXCJcIiArIHRoaXNdO1xuXG5cdGlmICh0aGlzLnBhcmVudCAhPT0gbnVsbCkge1xuXHRcdGJjID0gdGhpcy5wYXJlbnQuYnJlYWRDcnVtYigpLmNvbmNhdChiYyk7XG5cdH1cblx0cmV0dXJuIGJjO1xufTtcblxuUmVnaW9uLnByb3RvdHlwZS50cmVlID0gZnVuY3Rpb24oX2RlcHRoKSB7XG5cdF9kZXB0aCA9IF9kZXB0aCB8fCAwO1xuXG5cdHZhciB0ZXh0ID0gdGhpcyArIFwiXFxuXCI7XG5cblx0Xy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKF9jaGlsZCkge1xuXHRcdC8vIGNyZWF0ZSBpbmRlbnRcblx0XHRfKF9kZXB0aCArIDEpLnRpbWVzKGZ1bmN0aW9uKGkpIHtcblx0XHRcdHRleHQgKz0gXCJcXHRcIjtcblx0XHR9KTtcblxuXHRcdHRleHQgKz0gX2NoaWxkLnRyZWUoX2RlcHRoICsgMSk7XG5cdH0pO1xuXG5cdHJldHVybiB0ZXh0O1xufTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBQcmV2aWV3XG5cblJlZ2lvbi5wcm90b3R5cGUucHJldmlldyA9IGZ1bmN0aW9uKF9wYXJlbnRDb250ZXh0KSB7XG5cdHZhciBjb250ZXh0ID0gX3BhcmVudENvbnRleHQuZGVyaXZlQ29udGV4dCh0aGlzLnByb3BlcnRpZXMpO1xuXG5cdHRoaXMucHJldmlld0JvdW5kc0dyb3VwID0gbmV3IHBhcGVyLkdyb3VwKCk7XG5cdHRoaXMucHJldmlld1Bvc2l0aW9uR3JvdXAgPSBuZXcgcGFwZXIuR3JvdXAoKTtcblxuXHR0aGlzLnByZXZpZXdCb3VuZHNHcm91cC5vbk1vdXNlRW50ZXIgPSBfLmJpbmQodGhpcy5vbk1vdXNlRW50ZXIsIHRoaXMpO1xuXHR0aGlzLnByZXZpZXdCb3VuZHNHcm91cC5vbk1vdXNlTGVhdmUgPSBfLmJpbmQodGhpcy5vbk1vdXNlTGVhdmUsIHRoaXMpO1xuXHR0aGlzLnByZXZpZXdCb3VuZHNHcm91cC5vbkNsaWNrID0gXy5iaW5kKHRoaXMub25DbGljaywgdGhpcyk7XG5cblx0Ly8gYm91bmRzXG5cdHZhciBib3VuZHMgPSB0aGlzLmRyYXdCb3VuZHMoY29udGV4dC5ib3VuZHMpO1xuXHRib3VuZHMudHJhbnNmb3JtKGNvbnRleHQubWF0cml4KTtcblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAuYWRkQ2hpbGQoYm91bmRzKTtcblxuXHQvLyBwb3Ncblx0dmFyIHBvc2l0aW9uID0gdGhpcy5kcmF3UG9zaXRpb24oY29udGV4dC5wb3NpdGlvbiwgY29udGV4dC5tYXRyaXgpO1xuXHRwb3NpdGlvbi50cmFuc2Zvcm0oY29udGV4dC5tYXRyaXgpO1xuXHR0aGlzLnByZXZpZXdQb3NpdGlvbkdyb3VwLmFkZENoaWxkKHBvc2l0aW9uKTtcblxuXHR0aGlzLnNldFN0eWxlKFwiZGVmYXVsdFwiKTtcblxuXHQvLyBjaGlsZHJlblxuXHR0aGlzLnByZXZpZXdDaGlsZHJlbihjb250ZXh0KTtcbn07XG5cblxuUmVnaW9uLnByb3RvdHlwZS5wcmV2aWV3Q2hpbGRyZW4gPSBmdW5jdGlvbihfY29udGV4dCkge1xuXHRfLmVhY2godGhpcy5jaGlsZHJlbiwgZnVuY3Rpb24oX2NoaWxkKSB7XG5cdFx0X2NoaWxkLnByZXZpZXcoX2NvbnRleHQpO1xuXHR9KTtcbn07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBCdWlsZFxuXG5cblxuUmVnaW9uLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uKF9wYXJlbnRDb250ZXh0KSB7XG5cdHZhciBjb250ZXh0ID0gX3BhcmVudENvbnRleHQuZGVyaXZlQ29udGV4dCh0aGlzLnByb3BlcnRpZXMpO1xuXG5cdFxuXHQvLyBidWlsZCBvd24gcGF0aHNcblx0dmFyIG93blBhdGhzID0gW10uY29uY2F0KHRoaXMuZHJhd0J1aWxkKGNvbnRleHQuYm91bmRzKSk7XG5cdF8uZWFjaChvd25QYXRocywgZnVuY3Rpb24ocCkge1xuXHRcdHAudHJhbnNmb3JtKGNvbnRleHQubWF0cml4KTtcblx0fSwgdGhpcyk7XG5cdFxuXG5cdC8vIGNvbGxlY3QgY2hpbGQgcGF0aHMvb3BzXG5cdHZhciBjaGlsZFBhdGhTZXRzID0gW107XG5cdHZhciBjaGlsZE9wcyA9IFtdO1xuXHRfLmVhY2godGhpcy5jaGlsZHJlbiwgZnVuY3Rpb24oX2NoaWxkKSB7XG5cdFx0dmFyIHMgPSBfY2hpbGQuYnVpbGQoY29udGV4dCk7XG5cdFx0Y2hpbGRQYXRoU2V0cy5wdXNoKHMpO1xuXHRcdGNoaWxkT3BzLnB1c2goYm9vbGVhbk9wZXJhdGlvbnNbX2NoaWxkLnByb3BlcnRpZXMuYm9vbGVhbl0pO1xuXHR9KTtcblxuXG5cdC8vIGFycmFuZ2Ugb3BlcmFuZHNcblx0dmFyIGxlZnRQYXRoU2V0ID0gb3duUGF0aHM7XG5cdHZhciByaWdodFBhdGhTZXRzID0gY2hpbGRQYXRoU2V0cztcblx0dmFyIG9wcyA9IGNoaWxkT3BzO1xuXHR2YXIgcmVzdWx0UGF0aHMgPSBbXTtcblxuXHRpZiAob3duUGF0aHMubGVuZ3RoID09PSAwKSB7XG5cdFx0bGVmdFBhdGhTZXQgPSByaWdodFBhdGhTZXRzLnNwbGljZSgwLCAxKVswXTtcblx0XHRvcHMuc3BsaWNlKDAsIDEpO1xuXHR9XG5cblx0XG5cdC8vIGZpbHRlciBvdXQgbm9uIGJvb2xlYW5hYmxlIHBhdGhzIChza2lwcylcblx0dmFyIHNraXBzID0gXyhsZWZ0UGF0aFNldCkuZmlsdGVyKGZ1bmN0aW9uKF9wYXRoKSB7XG5cdFx0cmV0dXJuICEoX3BhdGggaW5zdGFuY2VvZiBwYXBlci5QYXRoIHx8IF9wYXRoIGluc3RhbmNlb2YgcGFwZXIuQ29tcG91bmRQYXRoKTtcblx0fSk7XG5cdHJlc3VsdFBhdGhzID0gcmVzdWx0UGF0aHMuY29uY2F0KHNraXBzKTtcblx0bGVmdFBhdGhTZXQgPSBfKGxlZnRQYXRoU2V0KS5kaWZmZXJlbmNlKHNraXBzKTtcblxuXHRfKHJpZ2h0UGF0aFNldHMpLmVhY2goZnVuY3Rpb24ocGF0aFNldCwgcGF0aFNldEluZGV4KSB7XG5cdFx0c2tpcHMgPSBfKHBhdGhTZXQpLmZpbHRlcihmdW5jdGlvbihfcGF0aCkge1xuXHRcdFx0cmV0dXJuICEoX3BhdGggaW5zdGFuY2VvZiBwYXBlci5QYXRoIHx8IF9wYXRoIGluc3RhbmNlb2YgcGFwZXIuQ29tcG91bmRQYXRoKTtcblx0XHR9KTtcblx0XHRyZXN1bHRQYXRocyA9IHJlc3VsdFBhdGhzLmNvbmNhdChza2lwcyk7XG5cdFx0cmlnaHRQYXRoU2V0c1twYXRoU2V0SW5kZXhdID0gXyhwYXRoU2V0KS5kaWZmZXJlbmNlKHNraXBzKTtcblx0fSk7XG5cblxuXHQvLyBwcm9jZXNzIHRoZSBib29sZWFuc1xuXHRfKGxlZnRQYXRoU2V0KS5lYWNoKGZ1bmN0aW9uKGxlZnRQYXRoLCBsZWZ0SW5kZXgpIHtcblx0XHRfKHJpZ2h0UGF0aFNldHMpLmVhY2goZnVuY3Rpb24ocmlnaHRQYXRoU2V0LCByaWdodEluZGV4KSB7XG5cdFx0XHRpZiAodHlwZW9mIG9wc1tyaWdodEluZGV4XSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0cmVzdWx0UGF0aHMgPSByZXN1bHRQYXRocy5jb25jYXQocmlnaHRQYXRoU2V0KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGJvb2xSZXN1bHQgPSB0aGlzLl9jb21iaW5lUGF0aHMobGVmdFBhdGhTZXRbbGVmdEluZGV4XSwgcmlnaHRQYXRoU2V0LCBvcHNbcmlnaHRJbmRleF0pO1xuXHRcdFx0bGVmdFBhdGhTZXRbbGVmdEluZGV4XSA9IGJvb2xSZXN1bHQ7XG5cdFx0fSwgdGhpcyk7XG5cdH0sIHRoaXMpO1xuXG5cblx0cmVzdWx0UGF0aHMgPSByZXN1bHRQYXRocy5jb25jYXQobGVmdFBhdGhTZXQpO1xuXG5cdHJldHVybiByZXN1bHRQYXRocztcblxufTtcblxuXG5SZWdpb24ucHJvdG90eXBlLl9jb21iaW5lUGF0aHMgPSBmdW5jdGlvbihfbGVmdFBhdGgsIF9yaWdodFBhdGhTZXQsIF9vcCkge1xuXG5cdGlmIChfcmlnaHRQYXRoU2V0Lmxlbmd0aCA8IDEpIHJldHVybiBfbGVmdFBhdGg7XG5cdC8vIGlmICh0eXBlb2YgX29wID09PSAndW5kZWZpbmVkJykgcmV0dXJuIF9sZWZ0UGF0aDtcblx0XG5cdF8oX3JpZ2h0UGF0aFNldCkuZWFjaCggZnVuY3Rpb24gKF9yaWdodFBhdGgpIHtcblx0XHRfbGVmdFBhdGgucmVtb3ZlKCk7XG5cdFx0X3JpZ2h0UGF0aC5yZW1vdmUoKTtcblx0XHR0cnkge1xuXHRcdFx0X2xlZnRQYXRoID0gX2xlZnRQYXRoW19vcF0oX3JpZ2h0UGF0aCk7XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRsb2cuYXBwZW5kV2FybmluZyhcIkZhaWxlZCB0byByZXNvbHZlIGJvb2xlYW4gb3BwZXJhdGlvbi5cIik7XG5cdFx0XHRjb25zb2xlLndhcm4oZSk7Ly8gdGhyb3coZSk7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIF9sZWZ0UGF0aDtcbn07IFxuXG5cblxuUmVnaW9uLnByb3RvdHlwZS5idWlsZENoaWxkcmVuID0gZnVuY3Rpb24oX2NvbnRleHQpIHtcblx0dmFyIGNoaWxkUGF0aHMgPSBbXTtcblxuXHRfLmVhY2godGhpcy5jaGlsZHJlbiwgZnVuY3Rpb24oX2NoaWxkKSB7XG5cdFx0dmFyIHMgPSBfY2hpbGQuYnVpbGQoX2NvbnRleHQpO1xuXHRcdGNoaWxkUGF0aHMgPSBjaGlsZFBhdGhzLmNvbmNhdChzKTtcblx0fSk7XG5cblx0cmV0dXJuIGNoaWxkUGF0aHM7XG59O1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gSGFuZHlcblxuUmVnaW9uLnByb3RvdHlwZS5nZXREZWNlbmRhbnRzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB1dGlsLmNvbGxlY3RUcmVlKHRoaXMsIFwiY2hpbGRyZW5cIik7XG59O1xuXG5SZWdpb24ucHJvdG90eXBlLmdldEFuY2VzdG9ycyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgYSA9IFtdO1xuXHRpZiAodGhpcy5wYXJlbnQpIHtcblx0XHRyZXR1cm4gW3RoaXMucGFyZW50XS5jb25jYXQodGhpcy5wYXJlbnQuZ2V0QW5jZXN0b3JzKCkpO1xuXHR9XG5cdHJldHVybiBbXTtcbn07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBFdmVudHNcblxuUmVnaW9uLnByb3RvdHlwZS5vbk1vdXNlRW50ZXIgPSBmdW5jdGlvbigpIHtcblx0JC5Ub3BpYyhcInJlZ2lvbi9vbk1vdXNlRW50ZXJcIikucHVibGlzaCh0aGlzKTtcbn07XG5cblJlZ2lvbi5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKCkge1xuXHQkLlRvcGljKFwicmVnaW9uL29uQ2xpY2tcIikucHVibGlzaCh0aGlzKTtcbn07XG5cblJlZ2lvbi5wcm90b3R5cGUub25Nb3VzZUxlYXZlID0gZnVuY3Rpb24oKSB7XG5cdCQuVG9waWMoXCJyZWdpb24vb25Nb3VzZUxlYXZlXCIpLnB1Ymxpc2godGhpcyk7XG59O1xuXG5SZWdpb24ucHJvdG90eXBlLnNldFN0eWxlID0gZnVuY3Rpb24oX3N0eWxlLCBfcmVjdXJzaXZlKSB7XG5cdF9zdHlsZSA9IF9zdHlsZSB8fCBcImRlZmF1bHRcIjtcblx0aWYgKCFzZXR0aW5ncy5zdHlsZXMuYm91bmRzW19zdHlsZV0pIHJldHVybjtcblxuXHRpZiAodGhpcy5pc1NoYXBlKSB7XG5cdFx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAuc3R5bGUgPSBzZXR0aW5ncy5zdHlsZXMuc2hhcGVbX3N0eWxlXTtcblx0fVxuXHRlbHNlIHtcblx0XHR0aGlzLnByZXZpZXdCb3VuZHNHcm91cC5zdHlsZSA9IHNldHRpbmdzLnN0eWxlcy5ib3VuZHNbX3N0eWxlXTtcblx0fVxuXHR0aGlzLnByZXZpZXdQb3NpdGlvbkdyb3VwLnN0eWxlID0gc2V0dGluZ3Muc3R5bGVzLnBvc2l0aW9uW19zdHlsZV07XG5cblx0aWYgKF9yZWN1cnNpdmUpIHtcblx0XHRfKHRoaXMuY2hpbGRyZW4pLmludm9rZSgnc2V0U3R5bGUnLCBfc3R5bGUsIHRydWUpO1xuXHR9XG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEZ1bmN0aW9ucyB0byBPdmVycmlkZVxuXG5cblJlZ2lvbi5wcm90b3R5cGUuZHJhd0JvdW5kcyA9IGZ1bmN0aW9uKF9ib3VuZHMpIHtcblx0cmV0dXJuIG5ldyBwYXBlci5QYXRoLlJlY3RhbmdsZShfYm91bmRzKTtcbn07XG5cblxuUmVnaW9uLnByb3RvdHlwZS5kcmF3QnVpbGQgPSBmdW5jdGlvbihfYm91bmRzKSB7XG5cdHJldHVybiBbXTtcbn07XG5cblxuUmVnaW9uLnByb3RvdHlwZS5kcmF3UG9zaXRpb24gPSBmdW5jdGlvbihfYm91bmRzLCBfbWF0cml4KSB7XG5cdHZhciBzY2FsaW5nID0gX21hdHJpeC5zY2FsaW5nO1xuXHR2YXIgcmVjdCA9IG5ldyBwYXBlci5SZWN0YW5nbGUoLTAuNSwgLTAuNSwgMSwgMSk7IC8vLnNjYWxlKDEvc2NhbGluZy54LCAxL3NjYWxpbmcueSlcblx0cmV0dXJuIG5ldyBwYXBlci5QYXRoLkVsbGlwc2UocmVjdC5zY2FsZSgxIC8gc2NhbGluZy54LCAxIC8gc2NhbGluZy55KSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciBDb250ZXh0ID0gcmVxdWlyZSgnLi4vQ29udGV4dC5qcycpO1xudmFyIFJlZ2lvbiA9IHJlcXVpcmUoJy4vUmVnaW9uLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVnaW9uR3JpZDtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gUmVnaW9uR3JpZFxuXG5mdW5jdGlvbiBSZWdpb25HcmlkKF9kYXRhLCBfcGFyZW50KSB7XG5cdFJlZ2lvbi5jYWxsKHRoaXMsIF9kYXRhLCBfcGFyZW50KTtcblx0dGhpcy50eXBlID0gXCJSZWdpb25HcmlkXCI7XG5cdHRoaXMuc3BlY2lmaWVkQ2hpbGRyZW4gPSB1bmRlZmluZWQ7XG59XG5cblJlZ2lvbkdyaWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWdpb24ucHJvdG90eXBlKTtcblJlZ2lvbkdyaWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmVnaW9uR3JpZDtcblxuXG5cblJlZ2lvbkdyaWQucHJvdG90eXBlLnByZXZpZXcgPSBmdW5jdGlvbihfcGFyZW50Q29udGV4dCkge1xuXHR2YXIgY29udGV4dCA9IF9wYXJlbnRDb250ZXh0LmRlcml2ZUNvbnRleHQodGhpcy5wcm9wZXJ0aWVzKTtcblxuXHR0aGlzLnByZXZpZXdCb3VuZHNHcm91cCA9IG5ldyBwYXBlci5Hcm91cCgpO1xuXHR0aGlzLnByZXZpZXdQb3NpdGlvbkdyb3VwID0gbmV3IHBhcGVyLkdyb3VwKCk7XG5cblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25Nb3VzZUVudGVyID0gXy5iaW5kKHRoaXMub25Nb3VzZUVudGVyLCB0aGlzKTtcblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25Nb3VzZUxlYXZlID0gXy5iaW5kKHRoaXMub25Nb3VzZUxlYXZlLCB0aGlzKTtcblx0dGhpcy5wcmV2aWV3Qm91bmRzR3JvdXAub25DbGljayA9IF8uYmluZCh0aGlzLm9uQ2xpY2ssIHRoaXMpO1xuXG5cblx0aWYgKCF0aGlzLnNwZWNpZmllZENoaWxkcmVuKSB7XG5cdFx0dGhpcy5nZW5lcmF0ZUNoaWxkcmVuKGNvbnRleHQpO1xuXHR9XG5cdF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuXHRcdGNoaWxkLnByZXZpZXcoY2hpbGQuY29udGV4dCk7XG5cdH0sIHRoaXMpO1xuXG5cdHRoaXMuc2V0U3R5bGUoXCJkZWZhdWx0XCIpO1xufTtcblxuUmVnaW9uR3JpZC5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbihfcGFyZW50Q29udGV4dCkge1xuXHR2YXIgY29udGV4dCA9IF9wYXJlbnRDb250ZXh0LmRlcml2ZUNvbnRleHQodGhpcy5wcm9wZXJ0aWVzKTtcblxuXG5cblx0aWYgKCF0aGlzLnNwZWNpZmllZENoaWxkcmVuKSB7XG5cdFx0dGhpcy5nZW5lcmF0ZUNoaWxkcmVuKGNvbnRleHQpO1xuXHR9XG5cblx0dmFyIGNoaWxkUGF0aHMgPSBbXTtcblx0Xy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG5cdFx0Y2hpbGRQYXRocyA9IGNoaWxkUGF0aHMuY29uY2F0KGNoaWxkLmJ1aWxkQ2hpbGRyZW4oY2hpbGQuY29udGV4dCkpO1xuXHR9LCB0aGlzKTtcblxuXG5cblx0Ly8gdmFyIGdyaWRDb250ZXh0cyA9IHRoaXMuZ2VuZXJhdGVDb250ZXh0cyhjb250ZXh0KTtcblx0Ly8gdmFyIGNoaWxkUGF0aHMgPSBbXTtcblx0Ly8gXy5lYWNoKGdyaWRDb250ZXh0cywgZnVuY3Rpb24oZ3JpZENvbnRleHQpIHtcblx0Ly8gXHRjaGlsZFBhdGhzID0gY2hpbGRQYXRocy5jb25jYXQodGhpcy5idWlsZENoaWxkcmVuKGdyaWRDb250ZXh0KSk7XG5cdC8vIH0sIHRoaXMpO1xuXG5cdHJldHVybiBjaGlsZFBhdGhzO1xufTtcblxuUmVnaW9uR3JpZC5wcm90b3R5cGUuZ2VuZXJhdGVDaGlsZHJlbiA9IGZ1bmN0aW9uKF9jb250ZXh0KSB7XG5cdHRoaXMuc3BlY2lmaWVkQ2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuXHR0aGlzLmNoaWxkcmVuID0gW107XG5cblx0dmFyIGdyaWRDb250ZXh0cyA9IHRoaXMuZ2VuZXJhdGVDb250ZXh0cyhfY29udGV4dCk7XG5cblx0dmFyIGkgPSAwO1xuXHRfLmVhY2goZ3JpZENvbnRleHRzLCBmdW5jdGlvbihncmlkQ29udGV4dCkge1xuXHRcdHZhciBncmlkQ2hpbGQgPSBuZXcgUmVnaW9uKCk7XG5cdFx0Z3JpZENoaWxkLnBhcmVudCA9IHRoaXM7XG5cdFx0Z3JpZENoaWxkLmVkaXRvclByb3BlcnRpZXMgPSB0aGlzLmVkaXRvclByb3BlcnRpZXM7XG5cdFx0Z3JpZENoaWxkLnByb3BlcnRpZXMubmFtZSA9IHRoaXMucHJvcGVydGllcy5uYW1lICsgXCJfXCIgKyBpKys7XG5cdFx0Xyh0aGlzLnNwZWNpZmllZENoaWxkcmVuKS5lYWNoKGZ1bmN0aW9uKF9jaGlsZCkge1xuXHRcdFx0dmFyIHByb3h5ID0gX2NoaWxkLnByb3h5KCk7XG5cdFx0XHRwcm94eS5wYXJlbnQgPSBncmlkQ2hpbGQ7XG5cdFx0XHRncmlkQ2hpbGQuY2hpbGRyZW4ucHVzaChwcm94eSk7XG5cdFx0fSwgdGhpcyk7XG5cblx0XHRncmlkQ2hpbGQuY29udGV4dCA9IGdyaWRDb250ZXh0O1xuXHRcdHRoaXMuY2hpbGRyZW4ucHVzaChncmlkQ2hpbGQpO1xuXHRcdC8vIGdyaWRDaGlsZC5wcmV2aWV3KGdyaWRDb250ZXh0KTtcblx0fSwgdGhpcyk7XG59O1xuXG5SZWdpb25HcmlkLnByb3RvdHlwZS5nZW5lcmF0ZUNvbnRleHRzID0gZnVuY3Rpb24oX2dyaWRDb250ZXh0KSB7XG5cdC8vIGNhbGN1bGF0ZSByb3dzL2NvbHMgdG8gZHJhd1xuXHR2YXIgcm93cyA9IDE7XG5cdHJvd3MgPSB0aGlzLnByb3BlcnRpZXMucm93cyB8fCByb3dzO1xuXHRyb3dzID0gKF9ncmlkQ29udGV4dC5ib3VuZHMuaGVpZ2h0IC8gdGhpcy5wcm9wZXJ0aWVzLnJvd19oZWlnaHQpIHx8IHJvd3M7XG5cblx0dmFyIGNvbHMgPSAxO1xuXHRjb2xzID0gdGhpcy5wcm9wZXJ0aWVzLmNvbHVtbnMgfHwgY29scztcblx0Y29scyA9IChfZ3JpZENvbnRleHQuYm91bmRzLndpZHRoIC8gdGhpcy5wcm9wZXJ0aWVzLmNvbHVtbl93aWR0aCkgfHwgY29scztcblxuXHR2YXIgd2lkdGggPSBfZ3JpZENvbnRleHQuYm91bmRzLndpZHRoIC8gY29scztcblx0dmFyIGhlaWdodCA9IF9ncmlkQ29udGV4dC5ib3VuZHMuaGVpZ2h0IC8gcm93cztcblx0dmFyIGJhc2VYID0gX2dyaWRDb250ZXh0LmJvdW5kcy5sZWZ0O1xuXHR2YXIgYmFzZVkgPSBfZ3JpZENvbnRleHQuYm91bmRzLnRvcDtcblxuXHRpZiAodGhpcy5wcm9wZXJ0aWVzLmNvbHVtbl9hbGlnbiA9PT0gJ3JpZ2h0Jykge1xuXHRcdGJhc2VYID0gX2dyaWRDb250ZXh0LmJvdW5kcy5yaWdodCAtIHdpZHRoICogTWF0aC5mbG9vcihjb2xzKTtcblx0fVxuXHRpZiAodGhpcy5wcm9wZXJ0aWVzLmNvbHVtbl9hbGlnbiA9PT0gJ2NlbnRlcicpIHtcblx0XHRiYXNlWCA9IF9ncmlkQ29udGV4dC5ib3VuZHMuY2VudGVyLnggLSB3aWR0aCAqIE1hdGguZmxvb3IoY29scykgKiAwLjU7XG5cdH1cblx0aWYgKHRoaXMucHJvcGVydGllcy5yb3dfYWxpZ24gPT09ICdib3R0b20nKSB7XG5cdFx0YmFzZVkgPSBfZ3JpZENvbnRleHQuYm91bmRzLmJvdHRvbSAtIGhlaWdodCAqIE1hdGguZmxvb3Iocm93cyk7XG5cdH1cblx0aWYgKHRoaXMucHJvcGVydGllcy5yb3dfYWxpZ24gPT09ICdjZW50ZXInKSB7XG5cdFx0YmFzZVkgPSBfZ3JpZENvbnRleHQuYm91bmRzLmNlbnRlci55IC0gaGVpZ2h0ICogTWF0aC5mbG9vcihyb3dzKSAqIDAuNTtcblx0fVxuXG5cdHZhciBnZW5lcmF0ZWRDb250ZXh0cyA9IFtdO1xuXG5cdGZvciAodmFyIHJvdyA9IDA7IHJvdyA8IE1hdGguZmxvb3Iocm93cyk7IHJvdysrKSB7XG5cdFx0Zm9yICh2YXIgY29sID0gMDsgY29sIDwgTWF0aC5mbG9vcihjb2xzKTsgY29sKyspIHtcblxuXHRcdFx0Ly8gZ2VuZXJhdGUgYm91bmRzXHRcdFx0XG5cdFx0XHRcblx0XHRcdHZhciB4ID0gYmFzZVggKyBjb2wgKiB3aWR0aDtcblx0XHRcdHZhciB5ID0gYmFzZVkgKyByb3cgKiBoZWlnaHQ7XG5cblx0XHRcdHZhciBncmlkUmVjdGFuZ2xlID0gbmV3IHBhcGVyLlJlY3RhbmdsZShcblx0XHRcdFx0bmV3IHBhcGVyLlBvaW50KHgsIHkpLFxuXHRcdFx0XHRuZXcgcGFwZXIuU2l6ZSh3aWR0aCwgaGVpZ2h0KVxuXHRcdFx0KTtcblxuXHRcdFx0dmFyIGdyaWRDb250ZXh0ID0gX2dyaWRDb250ZXh0LmRlcml2ZUNvbnRleHQoe1xuXHRcdFx0XHR0b3A6IHksXG5cdFx0XHRcdGJvdHRvbTogeStoZWlnaHQsXG5cdFx0XHRcdGxlZnQ6IHgsXG5cdFx0XHRcdHJpZ2h0OiB4K3dpZHRoLFxuXHRcdFx0XHRyZWdpc3RyYXRpb246IHRoaXMucHJvcGVydGllcy5yZWdpc3RyYXRpb25cblx0XHRcdH0pO1xuXG5cdFx0XHRnZW5lcmF0ZWRDb250ZXh0cy5wdXNoKGdyaWRDb250ZXh0KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZ2VuZXJhdGVkQ29udGV4dHM7XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG52YXIgUmVnaW9uID0gcmVxdWlyZSgnLi9SZWdpb24uanMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHQ7XG5cbnZhciBmb250O1xuXG4vKiBnbG9iYWwgX19kaXJuYW1lICovXG4vLyB1c2luZyBicm93c2VyaWZ5IGFuZCBicmZzIHRvIGlubGluZSB0aGUgc3ZnIGRhdGEuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vc3Vic3RhY2svYnJmc1xuXG52YXIgZm9udCA9IFwiPD94bWwgdmVyc2lvbj1cXFwiMS4wXFxcIiBlbmNvZGluZz1cXFwidXRmLThcXFwiPz5cXHJcXG48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+XFxyXFxuPCFET0NUWVBFIHN2ZyBQVUJMSUMgXFxcIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOXFxcIiBcXFwiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkXFxcIj5cXHJcXG48c3ZnIHZlcnNpb249XFxcIjEuMVxcXCIgeG1sbnM9XFxcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXFxcIiB4bWxuczp4bGluaz1cXFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1xcXCIgeD1cXFwiMHB4XFxcIiB5PVxcXCIwcHhcXFwiIHdpZHRoPVxcXCIzMHB4XFxcIlxcclxcblxcdCBoZWlnaHQ9XFxcIjYwcHhcXFwiIHZpZXdCb3g9XFxcIjAgMCAzMCA2MFxcXCIgZW5hYmxlLWJhY2tncm91bmQ9XFxcIm5ldyAwIDAgMzAgNjBcXFwiIHhtbDpzcGFjZT1cXFwicHJlc2VydmVcXFwiPlxcclxcbjxnIGlkPVxcXCJjaGFyLWFtcGVyc2FuZFxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE0yMy41NzEsMzYuNDI5QzIzLjU3MSwzMi44NzgsMjYuNDUsMzAsMzAsMzBoOC41NzFcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8Y2lyY2xlIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBjeD1cXFwiMTVcXFwiIGN5PVxcXCIxNVxcXCIgcj1cXFwiMTVcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTE1LDMwQzYuNzE2LDMwLDAsMzYuNzE1LDAsNDVjMCw4LjI4Myw2LjcxNiwxNSwxNSwxNWM4LjI4NCwwLDE1LTYuNzE3LDE1LTE1VjMwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLWV4Y2xhbWF0aW9uXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjVcXFwiIHkxPVxcXCI0MFxcXCIgeDI9XFxcIjVcXFwiIHkyPVxcXCIwXFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCI1XFxcIiB5MT1cXFwiNTBcXFwiIHgyPVxcXCI1XFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItcGVyaW9kXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjBcXFwiIHkxPVxcXCI2MFxcXCIgeDI9XFxcIjEwXFxcIiB5Mj1cXFwiNTBcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjBcXFwiIHkxPVxcXCI1MFxcXCIgeDI9XFxcIjEwXFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItcXVlc3Rpb25cXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMTVcXFwiIHkxPVxcXCI1MFxcXCIgeDI9XFxcIjE1XFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTE1LDQwVjMwYzguMjg1LDAsMTUtNi43MTcsMTUtMTVjMC04LjI4NS02LjcxNS0xNS0xNS0xNUM2LjcxNywwLDAsNi43MTUsMCwxNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1zZW1pY29sb25cXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiNVxcXCIgeTE9XFxcIjM1XFxcIiB4Mj1cXFwiNVxcXCIgeTI9XFxcIjQ1XFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE01LDU1djVjMCwyLjc2Mi0yLjIzOCw1LTUsNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1jb2xvblxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCI1XFxcIiB5MT1cXFwiMjBcXFwiIHgyPVxcXCI1XFxcIiB5Mj1cXFwiMzBcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjVcXFwiIHkxPVxcXCI0MFxcXCIgeDI9XFxcIjVcXFwiIHkyPVxcXCI1MFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci10aWxkZVxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE0yNC45OTgsMjVjMCwyLjc2Mi0yLjIzOCw1LTUsNUgxMGMtMi43NjIsMC01LDIuMjM4LTUsNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1jb21tYVxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE01LDU1djVjMCwyLjc2Mi0yLjIzOCw1LTUsNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1hcG9zdHJvcGhlXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTEwLDEwVjVjMC0yLjc2Mi0yLjIzOC01LTUtNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1xdW90ZVxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCIxMFxcXCIgeTE9XFxcIjBcXFwiIHgyPVxcXCIxMFxcXCIgeTI9XFxcIjEwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLWRvdWJsZXF1b3RlXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjE1XFxcIiB5MT1cXFwiMFxcXCIgeDI9XFxcIjE1XFxcIiB5Mj1cXFwiMTBcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjEwXFxcIiB5MT1cXFwiMFxcXCIgeDI9XFxcIjEwXFxcIiB5Mj1cXFwiMTBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItZGFzaFxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCI1XFxcIiB5MT1cXFwiMzBcXFwiIHgyPVxcXCIyNVxcXCIgeTI9XFxcIjMwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLTlcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxjaXJjbGUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGN4PVxcXCIxNVxcXCIgY3k9XFxcIjE1XFxcIiByPVxcXCIxNVxcXCIvPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMzBcXFwiIHkxPVxcXCIxNVxcXCIgeDI9XFxcIjMwXFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItOFxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGNpcmNsZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgY3g9XFxcIjE1XFxcIiBjeT1cXFwiMTVcXFwiIHI9XFxcIjE1XFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGNpcmNsZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgY3g9XFxcIjE1XFxcIiBjeT1cXFwiNDVcXFwiIHI9XFxcIjE1XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLTdcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjBcXFwiIHgyPVxcXCIzMFxcXCIgeTI9XFxcIjBcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjMwXFxcIiB5MT1cXFwiMFxcXCIgeDI9XFxcIjBcXFwiIHkyPVxcXCI2MFxcXCIvPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiNVxcXCIgeTE9XFxcIjMwXFxcIiB4Mj1cXFwiMjVcXFwiIHkyPVxcXCIzMFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci02XFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8Y2lyY2xlIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBjeD1cXFwiMTVcXFwiIGN5PVxcXCI0NVxcXCIgcj1cXFwiMTVcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTAsNDVWMTVDMCw2LjcxNSw2LjcxNywwLDE1LDBjOC4yODUsMCwxNSw2LjcxNSwxNSwxNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci01XFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTAsNDVjMCw4LjI4Myw2LjcxNywxNSwxNSwxNWM4LjI4NSwwLDE1LTYuNzE3LDE1LTE1YzAtOC4yODUtNi43MTUtMTUtMTUtMTVIMFYwaDMwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLTRcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwb2x5bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgcG9pbnRzPVxcXCJcXHJcXG5cXHRcXHQyNSw2MCAyNSwwIDAsMzAgMzAsMzAgXFx0XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLTNcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwYXRoIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRNMCw0NWMwLDguMjgzLDYuNzE2LDE1LDE1LDE1czE1LTYuNzE3LDE1LTE1YzAtOC4yODUtNi43MTYtMTUtMTUtMTVjOC4yODQsMCwxNS02LjcxNywxNS0xNWMwLTguMjg1LTYuNzE2LTE1LTE1LTE1UzAsNi43MTUsMCwxNVxcXCJcXHJcXG5cXHRcXHQvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci0yXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTMwLDYwSDBsMjcuNDU3LTM2LjY0NkMyOS4wNjIsMjAuOTY3LDMwLDE4LjA5MywzMCwxNWMwLTguMjg1LTYuNzE2LTE1LTE1LTE1UzAsNi43MTUsMCwxNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci0xXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cG9seWxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHBvaW50cz1cXFwiXFxyXFxuXFx0XFx0MTUsMCAwLDEwIDE1LDAgMTUsNjAgMCw2MCAzMCw2MCBcXHRcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItMFxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE0zMCw0NVYxNWMwLTguMjg0LTYuNzE2LTE1LTE1LTE1UzAsNi43MTYsMCwxNXYzMGMwLDguMjg0LDYuNzE2LDE1LDE1LDE1UzMwLDUzLjI4NCwzMCw0NXpcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjVcXFwiIHkxPVxcXCI1XFxcIiB4Mj1cXFwiMjVcXFwiIHkyPVxcXCI1NVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci16XFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cG9seWxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHBvaW50cz1cXFwiXFxyXFxuXFx0XFx0MzAsNjAgMCw2MCAzMCwzMC4zMzMgMCwzMC4zMzMgXFx0XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLXlcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdDxnIGRpc3BsYXk9XFxcImlubGluZVxcXCI+XFxyXFxuXFx0XFx0XFxyXFxuXFx0XFx0XFx0PGxpbmUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjMwXFxcIiB4Mj1cXFwiMTJcXFwiIHkyPVxcXCI2MFxcXCIvPlxcclxcblxcdFxcdFxcclxcblxcdFxcdFxcdDxsaW5lIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjMwXFxcIiB5MT1cXFwiMzBcXFwiIHgyPVxcXCIwXFxcIiB5Mj1cXFwiODBcXFwiLz5cXHJcXG5cXHQ8L2c+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLXhcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdDxnIGRpc3BsYXk9XFxcImlubGluZVxcXCI+XFxyXFxuXFx0XFx0XFxyXFxuXFx0XFx0XFx0PGxpbmUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjMwXFxcIiB4Mj1cXFwiMzBcXFwiIHkyPVxcXCI2MFxcXCIvPlxcclxcblxcdFxcdFxcclxcblxcdFxcdFxcdDxsaW5lIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjMwXFxcIiB5MT1cXFwiMzBcXFwiIHgyPVxcXCIwXFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG5cXHQ8L2c+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLXdcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdDxnIGRpc3BsYXk9XFxcImlubGluZVxcXCI+XFxyXFxuXFx0XFx0PHBhdGggZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRcXHRNMCwzMHYyMi41QzAsNTYuNjQzLDMuMzU3LDYwLDcuNSw2MHM3LjUtMy4zNTcsNy41LTcuNWMwLDQuMTQzLDMuMzU3LDcuNSw3LjUsNy41czcuNS0zLjM1Nyw3LjUtNy41VjMwXFxcIi8+XFxyXFxuXFx0XFx0XFxyXFxuXFx0XFx0XFx0PGxpbmUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMTVcXFwiIHkxPVxcXCI1Mi41XFxcIiB4Mj1cXFwiMTVcXFwiIHkyPVxcXCI0NVxcXCIvPlxcclxcblxcdDwvZz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItdlxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBvbHlsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBwb2ludHM9XFxcIlxcclxcblxcdFxcdDMwLDMwIDE1LDYwIDAsMzAgXFx0XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLXVcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdDxnIGRpc3BsYXk9XFxcImlubGluZVxcXCI+XFxyXFxuXFx0XFx0PHBhdGggZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRcXHRNMzAsMzB2MTVjMCw4LjI4NS02LjcxNiwxNS0xNSwxNVMwLDUzLjI4NSwwLDQ1VjMwXFxcIi8+XFxyXFxuXFx0XFx0XFxyXFxuXFx0XFx0XFx0PGxpbmUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMzBcXFwiIHkxPVxcXCI0NVxcXCIgeDI9XFxcIjMwXFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG5cXHQ8L2c+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLXRcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdDxnIGRpc3BsYXk9XFxcImlubGluZVxcXCI+XFxyXFxuXFx0XFx0PHBhdGggZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRcXHRNMTAsMHY1MGMwLDUuNTIyLDQuNDc4LDEwLDEwLDEwczEwLTQuNDc4LDEwLTEwXFxcIi8+XFxyXFxuXFx0XFx0XFxyXFxuXFx0XFx0XFx0PGxpbmUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjMwXFxcIiB4Mj1cXFwiMzBcXFwiIHkyPVxcXCIzMFxcXCIvPlxcclxcblxcdDwvZz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItc1xcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0PGcgZGlzcGxheT1cXFwiaW5saW5lXFxcIj5cXHJcXG5cXHRcXHQ8cGF0aCBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdFxcdE0zMCwzNy41YzAtNC4xNDItMy4zNTctNy41LTcuNS03LjVoLTE1QzMuMzU5LDMwLDAsMzMuMzU4LDAsMzcuNVMzLjM1OSw0NSw3LjUsNDVoMTVjNC4xNDMsMCw3LjUsMy4zNTgsNy41LDcuNVxcclxcblxcdFxcdFxcdFMyNi42NDMsNjAsMjIuNSw2MGgtMTVDMy4zNTksNjAsMCw1Ni42NDIsMCw1Mi41XFxcIi8+XFxyXFxuXFx0PC9nPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1yXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHQ8ZyBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiPlxcclxcblxcdFxcdDxwYXRoIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0XFx0TTMwLDQ1YzAtOC4yODUtNi43MTYtMTUtMTUtMTVTMCwzNi43MTUsMCw0NXYxNVYzMFxcXCIvPlxcclxcblxcdDwvZz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItcVxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGNpcmNsZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgY3g9XFxcIjE1XFxcIiBjeT1cXFwiNDVcXFwiIHI9XFxcIjE1XFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBvbHlsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBwb2ludHM9XFxcIlxcclxcblxcdFxcdDMwLDMwIDMwLDgwIDQwLDcwIFxcdFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1wXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHQ8ZyBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiPlxcclxcblxcdFxcdDxnPlxcclxcblxcdFxcdFxcdFxcclxcblxcdFxcdFxcdFxcdDxjaXJjbGUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBjeD1cXFwiMTVcXFwiIGN5PVxcXCI0NVxcXCIgcj1cXFwiMTVcXFwiLz5cXHJcXG5cXHRcXHQ8L2c+XFxyXFxuXFx0XFx0XFxyXFxuXFx0XFx0XFx0PGxpbmUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjMwXFxcIiB4Mj1cXFwiMFxcXCIgeTI9XFxcIjgwXFxcIi8+XFxyXFxuXFx0PC9nPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1vXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHQ8ZyBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiPlxcclxcblxcdFxcdFxcclxcblxcdFxcdFxcdDxjaXJjbGUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBjeD1cXFwiMTVcXFwiIGN5PVxcXCI0NVxcXCIgcj1cXFwiMTVcXFwiLz5cXHJcXG5cXHQ8L2c+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLW5cXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdDxnIGRpc3BsYXk9XFxcImlubGluZVxcXCI+XFxyXFxuXFx0XFx0PHBhdGggZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRcXHRNMzAsNjBWNDVjMC04LjI4NS02LjcxNy0xNS0xNS0xNUM2LjcxNSwzMCwwLDM2LjcxNSwwLDQ1djE1VjMwXFxcIi8+XFxyXFxuXFx0PC9nPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1tXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHQ8ZyBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiPlxcclxcblxcdFxcdDxnPlxcclxcblxcdFxcdFxcdDxwYXRoIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0XFx0XFx0TTMwLDYwVjM3LjVjMC00LjE0My0zLjM1Ny03LjUtNy41LTcuNVMxNSwzMy4zNTcsMTUsMzcuNWMwLTQuMTQzLTMuMzU3LTcuNS03LjUtNy41UzAsMzMuMzU3LDAsMzcuNVY2MFxcXCIvPlxcclxcblxcdFxcdFxcdFxcclxcblxcdFxcdFxcdFxcdDxsaW5lIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjE1XFxcIiB5MT1cXFwiMzcuNVxcXCIgeDI9XFxcIjE1XFxcIiB5Mj1cXFwiNDVcXFwiLz5cXHJcXG5cXHRcXHQ8L2c+XFxyXFxuXFx0XFx0XFxyXFxuXFx0XFx0XFx0PGxpbmUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjQwXFxcIiB4Mj1cXFwiMFxcXCIgeTI9XFxcIjMwXFxcIi8+XFxyXFxuXFx0PC9nPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1sXFxcIj5cXHJcXG5cXHQ8cGF0aCBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE01LDBoNWMyLjc2MiwwLDUsMi4yMzgsNSw1djUwYzAsMi43NjIsMi4yMzgsNSw1LDVoNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1rXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHQ8ZyBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiPlxcclxcblxcdFxcdFxcclxcblxcdFxcdFxcdDxsaW5lIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjBcXFwiIHkxPVxcXCI0NVxcXCIgeDI9XFxcIjMwXFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG5cXHRcXHRcXHJcXG5cXHRcXHRcXHQ8bGluZSBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCIwXFxcIiB5MT1cXFwiNDVcXFwiIHgyPVxcXCIyMFxcXCIgeTI9XFxcIjMwXFxcIi8+XFxyXFxuXFx0XFx0XFxyXFxuXFx0XFx0XFx0PGxpbmUgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjYwXFxcIiB4Mj1cXFwiMFxcXCIgeTI9XFxcIjBcXFwiLz5cXHJcXG5cXHQ8L2c+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLWpcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMjBcXFwiIHkxPVxcXCIyNVxcXCIgeDI9XFxcIjIwXFxcIiB5Mj1cXFwiMTVcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTMwLDMwaC01Yy0yLjc2MiwwLTUsMi4yMzgtNSw1djM1YzAsNS41MjItNC40NzgsMTAtMTAsMTBTMCw3NS41MjIsMCw3MFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1pXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHQ8ZyBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiPlxcclxcblxcdFxcdFxcclxcblxcdFxcdFxcdDxsaW5lIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjEwXFxcIiB5MT1cXFwiMjVcXFwiIHgyPVxcXCIxMFxcXCIgeTI9XFxcIjE1XFxcIi8+XFxyXFxuXFx0XFx0PHBhdGggZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRcXHRNMCwzMGgxMHYyMGMwLDUuNTIyLDQuNDc4LDEwLDEwLDEwczEwLTQuNDc4LDEwLTEwXFxcIi8+XFxyXFxuXFx0PC9nPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1oXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTMwLDYwVjQ1YzAtOC4yODUtNi43MTYtMTUtMTUtMTVTMCwzNi43MTUsMCw0NXYxNVYwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLWdcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxjaXJjbGUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGN4PVxcXCIxNVxcXCIgY3k9XFxcIjQ1XFxcIiByPVxcXCIxNVxcXCIvPlxcclxcblxcdFxcclxcblxcdFxcdDxwYXRoIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRNMzAsNDV2MjBjMCw4LjI4My02LjcxNiwxNS0xNSwxNVMwLDczLjI4MywwLDY1XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLWZcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdDxnIGRpc3BsYXk9XFxcImlubGluZVxcXCI+XFxyXFxuXFx0XFx0PHBhdGggZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRcXHRNMTUsMzBcXFwiLz5cXHJcXG5cXHRcXHRcXHJcXG5cXHRcXHRcXHQ8bGluZSBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCIwXFxcIiB5MT1cXFwiMzBcXFwiIHgyPVxcXCIzMFxcXCIgeTI9XFxcIjMwXFxcIi8+XFxyXFxuXFx0XFx0PHBhdGggZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRcXHRNMCw2MGg1YzIuNzYyLDAsNS0yLjIzOCw1LTVWMTBjMC01LjUyMiw0LjQ3OC0xMCwxMC0xMHMxMCw0LjQ3OCwxMCwxMFxcXCIvPlxcclxcblxcdDwvZz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItZVxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE0yNS42MDYsNTUuNjA2QzIyLjY3OCw1OC41MzUsMTguODM5LDYwLDE1LDYwQzYuNzE2LDYwLDAsNTMuMjgzLDAsNDVjMC04LjI4NSw2LjcxNi0xNSwxNS0xNXMxNSw2LjcxNSwxNSwxNUgwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLWRcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxjaXJjbGUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGN4PVxcXCIxNVxcXCIgY3k9XFxcIjQ1XFxcIiByPVxcXCIxNVxcXCIvPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMzBcXFwiIHkxPVxcXCI2MFxcXCIgeDI9XFxcIjMwXFxcIiB5Mj1cXFwiMFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1jXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTI1LjYwNiwzNC4zOTRjLTUuODU4LTUuODU4LTE1LjM1NS01Ljg1OC0yMS4yMTMsMGMtNS44NTgsNS44NTctNS44NTgsMTUuMzU0LDAsMjEuMjEzYzUuODU2LDUuODU3LDE1LjM1NSw1Ljg1OCwyMS4yMTMsMFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1iXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjBcXFwiIHkxPVxcXCI2MFxcXCIgeDI9XFxcIjBcXFwiIHkyPVxcXCIwXFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGNpcmNsZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIyXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgY3g9XFxcIjE1XFxcIiBjeT1cXFwiNDVcXFwiIHI9XFxcIjE1XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLWFcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxjaXJjbGUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiMlxcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGN4PVxcXCIxNVxcXCIgY3k9XFxcIjQ1XFxcIiByPVxcXCIxNVxcXCIvPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjJcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMzBcXFwiIHkxPVxcXCI0NVxcXCIgeDI9XFxcIjMwXFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItWlxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBvbHlsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBwb2ludHM9XFxcIlxcclxcblxcdFxcdDMwLDYwIDAsNjAgMzAsMCAwLDAgXFx0XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLVlcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjBcXFwiIHgyPVxcXCIxNVxcXCIgeTI9XFxcIjMwXFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCIxNVxcXCIgeTE9XFxcIjMwXFxcIiB4Mj1cXFwiMzBcXFwiIHkyPVxcXCIwXFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCIxNVxcXCIgeTE9XFxcIjMwXFxcIiB4Mj1cXFwiMTVcXFwiIHkyPVxcXCI2MFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1YXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjBcXFwiIHkxPVxcXCIwXFxcIiB4Mj1cXFwiMzBcXFwiIHkyPVxcXCI2MFxcXCIvPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjYwXFxcIiB4Mj1cXFwiMzBcXFwiIHkyPVxcXCIwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLVdcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwb2x5bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgcG9pbnRzPVxcXCJcXHJcXG5cXHRcXHQwLDAgMCw2MCAxNSwxMCAzMCw2MCAzMCwwIFxcdFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1WXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cG9seWxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHBvaW50cz1cXFwiXFxyXFxuXFx0XFx0MCwwIDE1LDYwIDMwLDAgXFx0XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLVVcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwYXRoIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRNMCwwdjQ1YzAsOC4yODQsNi43MTUsMTUsMTUsMTVjOC4yODMsMCwxNS02LjcxNiwxNS0xNVYwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLVRcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwb2x5bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgcG9pbnRzPVxcXCJcXHJcXG5cXHRcXHQzMCwwIDAsMCAxNSwwIDE1LDYwIFxcdFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1TXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTAsNDVjMCw4LjI4NCw2LjcxNiwxNSwxNSwxNXMxNS02LjcxNiwxNS0xNXMtNi43MTYtMTUtMTUtMTVTMCwyMy4yODQsMCwxNVM2LjcxNiwwLDE1LDBzMTUsNi43MTYsMTUsMTVcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItUlxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE0wLDMwaDE1YzguMjg0LDAsMTUtNi43MTYsMTUtMTVTMjMuMjg0LDAsMTUsMEgwdjYwXFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCIwXFxcIiB5MT1cXFwiMzBcXFwiIHgyPVxcXCIzMFxcXCIgeTI9XFxcIjYwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLVFcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwYXRoIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRNMzAsNDVWMTVjMC04LjI4NC02LjcxNi0xNS0xNS0xNVMwLDYuNzE2LDAsMTV2MzBjMCw4LjI4NCw2LjcxNiwxNSwxNSwxNVMzMCw1My4yODQsMzAsNDV6XFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCIzMFxcXCIgeTE9XFxcIjYwXFxcIiB4Mj1cXFwiMTVcXFwiIHkyPVxcXCI0NVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1QXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTAsMzBoMTVjOC4yODUsMCwxNS02LjcxNiwxNS0xNVMyMy4yODUsMCwxNSwwSDB2NjBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItT1xcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE0zMCw0NVYxNWMwLTguMjg0LTYuNzE1LTE1LTE1LTE1QzYuNzE3LDAsMCw2LjcxNiwwLDE1djMwYzAsOC4yODQsNi43MTcsMTUsMTUsMTVDMjMuMjg1LDYwLDMwLDUzLjI4NCwzMCw0NXpcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItTlxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBvbHlsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBwb2ludHM9XFxcIlxcclxcblxcdFxcdDAsNjAgMCwwIDMwLDYwIDMwLDAgXFx0XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLU1cXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwb2x5bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgcG9pbnRzPVxcXCJcXHJcXG5cXHRcXHQzMCw2MCAzMCwwIDE1LDUwIDAsMCAwLDYwIFxcdFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1MXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cG9seWxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHBvaW50cz1cXFwiXFxyXFxuXFx0XFx0MzAsNjAgMCw2MCAwLDAgXFx0XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLUtcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjBcXFwiIHgyPVxcXCIwXFxcIiB5Mj1cXFwiNjBcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cG9seWxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHBvaW50cz1cXFwiXFxyXFxuXFx0XFx0MzAsMCAwLDMwIDMwLDYwIFxcdFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1KXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTEwLDBoMjB2NDVjMCw4LjI4NC02LjcxNiwxNS0xNSwxNVMwLDUzLjI4NCwwLDQ1XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLUlcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwb2x5bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgcG9pbnRzPVxcXCJcXHJcXG5cXHRcXHQzMCwwIDAsMCAxNSwwIDE1LDYwIDAsNjAgMzAsNjAgXFx0XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLUhcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMFxcXCIgeTE9XFxcIjYwXFxcIiB4Mj1cXFwiMFxcXCIgeTI9XFxcIjBcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjMwXFxcIiB5MT1cXFwiNjBcXFwiIHgyPVxcXCIzMFxcXCIgeTI9XFxcIjBcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjBcXFwiIHkxPVxcXCIzMFxcXCIgeDI9XFxcIjMwXFxcIiB5Mj1cXFwiMzBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItR1xcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBhdGggZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIGQ9XFxcIlxcclxcblxcdFxcdE0zMCwxNWMwLTguMjg0LTYuNzE1LTE1LTE1LTE1QzYuNzE3LDAsMCw2LjcxNiwwLDE1djMwYzAsOC4yODQsNi43MTcsMTUsMTUsMTVjOC4yODUsMCwxNS02LjcxNiwxNS0xNVYzMEgxMFxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1GXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cG9seWxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHBvaW50cz1cXFwiXFxyXFxuXFx0XFx0MCw2MCAwLDAgMzAsMCBcXHRcXFwiLz5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8bGluZSBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgeDE9XFxcIjBcXFwiIHkxPVxcXCIzMFxcXCIgeDI9XFxcIjEwXFxcIiB5Mj1cXFwiMzBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPGcgaWQ9XFxcImNoYXItRVxcXCIgZGlzcGxheT1cXFwibm9uZVxcXCI+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PHBvbHlsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBwb2ludHM9XFxcIlxcclxcblxcdFxcdDMwLDYwIDAsNjAgMCwwIDMwLDAgXFx0XFxcIi8+XFxyXFxuXFx0XFxyXFxuXFx0XFx0PGxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHgxPVxcXCIwXFxcIiB5MT1cXFwiMzBcXFwiIHgyPVxcXCIxMFxcXCIgeTI9XFxcIjMwXFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLURcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwYXRoIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRNMzAsMTVjMC04LjI4NC02LjcxNi0xNS0xNS0xNUgwdjYwaDE1YzguMjg0LDAsMTUtNi43MTYsMTUtMTVWMTV6XFxcIi8+XFxyXFxuPC9nPlxcclxcbjxnIGlkPVxcXCJjaGFyLUNcXFwiIGRpc3BsYXk9XFxcIm5vbmVcXFwiPlxcclxcblxcdFxcclxcblxcdFxcdDxwYXRoIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiBkPVxcXCJcXHJcXG5cXHRcXHRNMzAsMTVjMC04LjI4NC02LjcxNi0xNS0xNS0xNVMwLDYuNzE2LDAsMTV2MzBjMCw4LjI4NCw2LjcxNiwxNSwxNSwxNXMxNS02LjcxNiwxNS0xNVxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1CXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cGF0aCBkaXNwbGF5PVxcXCJpbmxpbmVcXFwiIGZpbGw9XFxcIm5vbmVcXFwiIHN0cm9rZT1cXFwiIzAwMDAwMFxcXCIgc3Ryb2tlLXdpZHRoPVxcXCIzXFxcIiBzdHJva2UtbGluZWNhcD1cXFwicm91bmRcXFwiIHN0cm9rZS1saW5lam9pbj1cXFwicm91bmRcXFwiIHN0cm9rZS1taXRlcmxpbWl0PVxcXCIxMFxcXCIgZD1cXFwiXFxyXFxuXFx0XFx0TTE1LDBjOC4yODMsMCwxNSw2LjcxNywxNSwxNXMtNi43MTcsMTUtMTUsMTVjOC4yODMsMCwxNSw2LjcxNywxNSwxNXMtNi43MTcsMTUtMTUsMTVIMFYwSDE1elxcXCIvPlxcclxcbjwvZz5cXHJcXG48ZyBpZD1cXFwiY2hhci1BXFxcIiBkaXNwbGF5PVxcXCJub25lXFxcIj5cXHJcXG5cXHRcXHJcXG5cXHRcXHQ8cG9seWxpbmUgZGlzcGxheT1cXFwiaW5saW5lXFxcIiBmaWxsPVxcXCJub25lXFxcIiBzdHJva2U9XFxcIiMwMDAwMDBcXFwiIHN0cm9rZS13aWR0aD1cXFwiM1xcXCIgc3Ryb2tlLWxpbmVjYXA9XFxcInJvdW5kXFxcIiBzdHJva2UtbGluZWpvaW49XFxcInJvdW5kXFxcIiBzdHJva2UtbWl0ZXJsaW1pdD1cXFwiMTBcXFwiIHBvaW50cz1cXFwiXFxyXFxuXFx0XFx0MzAsNjAgMTUsMCAwLDYwIFxcdFxcXCIvPlxcclxcblxcdFxcclxcblxcdFxcdDxsaW5lIGRpc3BsYXk9XFxcImlubGluZVxcXCIgZmlsbD1cXFwibm9uZVxcXCIgc3Ryb2tlPVxcXCIjMDAwMDAwXFxcIiBzdHJva2Utd2lkdGg9XFxcIjNcXFwiIHN0cm9rZS1saW5lY2FwPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLWxpbmVqb2luPVxcXCJyb3VuZFxcXCIgc3Ryb2tlLW1pdGVybGltaXQ9XFxcIjEwXFxcIiB4MT1cXFwiMjIuNVxcXCIgeTE9XFxcIjMwXFxcIiB4Mj1cXFwiNy41XFxcIiB5Mj1cXFwiMzBcXFwiLz5cXHJcXG48L2c+XFxyXFxuPC9zdmc+XFxyXFxuXCI7XG5cblxuXG4vLyAkLmFqYXgoe1xuLy8gXHR1cmw6IFwiaW1hZ2VzL2ZvbnRzL3N1dHRvbl8zMHg2MC5zdmdcIixcbi8vIFx0c3VjY2VzczogZnVuY3Rpb24oX2RhdGEpIHtcbi8vIFx0XHRmb250ID0gX2RhdGE7XG4vLyBcdH1cbi8vIH0pO1xuXG52YXIgZm9udF9oZWlnaHQgPSA2MDtcbnZhciBmb250X3dpZHRoID0gMzA7XG52YXIgZm9udF9zcGFjaW5nID0gMTU7XG5cbnZhciBnbHlwaE1hcCA9IHtcbicmJzogXCJjaGFyLWFtcGVyc2FuZFwiLFxuJyEnOiBcImNoYXItZXhjbGFtYXRpb25cIixcbicuJzogXCJjaGFyLXBlcmlvZFwiLFxuJz8nOiBcImNoYXItcXVlc3Rpb25cIixcbic7JzogXCJjaGFyLXNlbWljb2xvblwiLFxuJzonOiBcImNoYXItY29sb25cIixcbid+JzogXCJjaGFyLXRpbGRlXCIsXG4nLCc6IFwiY2hhci1jb21tYVwiLFxuJ+KAmSc6IFwiY2hhci1hcG9zdHJvcGhlXCIsXG4nXFwnJzogXCJjaGFyLXF1b3RlXCIsXG4nXCInOiBcImNoYXItZG91YmxlcXVvdGVcIixcbictJzogXCJjaGFyLWRhc2hcIixcbic5JzogXCJjaGFyLTlcIixcbic4JzogXCJjaGFyLThcIixcbic3JzogXCJjaGFyLTdcIixcbic2JzogXCJjaGFyLTZcIixcbic1JzogXCJjaGFyLTVcIixcbic0JzogXCJjaGFyLTRcIixcbiczJzogXCJjaGFyLTNcIixcbicyJzogXCJjaGFyLTJcIixcbicxJzogXCJjaGFyLTFcIixcbicwJzogXCJjaGFyLTBcIixcbid6JzogXCJjaGFyLXpcIixcbid5JzogXCJjaGFyLXlcIixcbid4JzogXCJjaGFyLXhcIixcbid3JzogXCJjaGFyLXdcIixcbid2JzogXCJjaGFyLXZcIixcbid1JzogXCJjaGFyLXVcIixcbid0JzogXCJjaGFyLXRcIixcbidzJzogXCJjaGFyLXNcIixcbidyJzogXCJjaGFyLXJcIixcbidxJzogXCJjaGFyLXFcIixcbidwJzogXCJjaGFyLXBcIixcbidvJzogXCJjaGFyLW9cIixcbiduJzogXCJjaGFyLW5cIixcbidtJzogXCJjaGFyLW1cIixcbidsJzogXCJjaGFyLWxcIixcbidrJzogXCJjaGFyLWtcIixcbidqJzogXCJjaGFyLWpcIixcbidpJzogXCJjaGFyLWlcIixcbidoJzogXCJjaGFyLWhcIixcbidnJzogXCJjaGFyLWdcIixcbidmJzogXCJjaGFyLWZcIixcbidlJzogXCJjaGFyLWVcIixcbidkJzogXCJjaGFyLWRcIixcbidjJzogXCJjaGFyLWNcIixcbidiJzogXCJjaGFyLWJcIixcbidhJzogXCJjaGFyLWFcIixcbidaJzogXCJjaGFyLVpcIixcbidZJzogXCJjaGFyLVlcIixcbidYJzogXCJjaGFyLVhcIixcbidXJzogXCJjaGFyLVdcIixcbidWJzogXCJjaGFyLVZcIixcbidVJzogXCJjaGFyLVVcIixcbidUJzogXCJjaGFyLVRcIixcbidTJzogXCJjaGFyLVNcIixcbidSJzogXCJjaGFyLVJcIixcbidRJzogXCJjaGFyLVFcIixcbidQJzogXCJjaGFyLVBcIixcbidPJzogXCJjaGFyLU9cIixcbidOJzogXCJjaGFyLU5cIixcbidNJzogXCJjaGFyLU1cIixcbidMJzogXCJjaGFyLUxcIixcbidLJzogXCJjaGFyLUtcIixcbidKJzogXCJjaGFyLUpcIixcbidJJzogXCJjaGFyLUlcIixcbidIJzogXCJjaGFyLUhcIixcbidHJzogXCJjaGFyLUdcIixcbidGJzogXCJjaGFyLUZcIixcbidFJzogXCJjaGFyLUVcIixcbidEJzogXCJjaGFyLURcIixcbidDJzogXCJjaGFyLUNcIixcbidCJzogXCJjaGFyLUJcIixcbidBJzogXCJjaGFyLUFcIixcbn07XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gVGV4dFxuXG5mdW5jdGlvbiBUZXh0KF9kYXRhLCBfcGFyZW50KSB7XG5cdFJlZ2lvbi5jYWxsKHRoaXMsIF9kYXRhLCBfcGFyZW50KTtcblx0dGhpcy50eXBlID0gXCJUZXh0XCI7XG5cdHRoaXMuaXNTaGFwZSA9IHRydWU7XG59XG5cblRleHQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWdpb24ucHJvdG90eXBlKTtcblRleHQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVGV4dDtcblxuVGV4dC5wcm90b3R5cGUuZHJhd0JvdW5kcyA9IGZ1bmN0aW9uKF9ib3VuZHMpIHtcblxuXHR2YXIgdGV4dEdyb3VwID0gbmV3IHBhcGVyLkdyb3VwKCk7XG5cblx0dmFyIHNjYWxlID0gdGhpcy5wcm9wZXJ0aWVzLnNpemUgLyBmb250X2hlaWdodDtcblx0dmFyIHBvc2l0aW9uID0gbmV3IHBhcGVyLlBvaW50KDAsIDApO1xuXHRpZiAodGhpcy5wcm9wZXJ0aWVzLmFsaWduID09ICdjZW50ZXInKSB7XG5cdFx0cG9zaXRpb24ueCA9IC0odGhpcy5wcm9wZXJ0aWVzLnRleHQubGVuZ3RoICogMC41KSAqIChmb250X3dpZHRoICsgZm9udF9zcGFjaW5nIC0gMSkgKiBzY2FsZTtcblx0fVxuXHRpZiAodGhpcy5wcm9wZXJ0aWVzLmFsaWduID09ICdyaWdodCcpIHtcblx0XHRwb3NpdGlvbi54ID0gLSh0aGlzLnByb3BlcnRpZXMudGV4dC5sZW5ndGgpICogKGZvbnRfd2lkdGggKyBmb250X3NwYWNpbmcgLSAxKSAqIHNjYWxlO1xuXHR9XG5cdGlmICh0aGlzLnByb3BlcnRpZXMudmVydGljYWxfYWxpZ24gPT0gJ2NlbnRlcicpIHtcblx0XHRwb3NpdGlvbi55ID0gLShmb250X2hlaWdodCAqIDAuNSkgKiBzY2FsZTtcblx0fVxuXHRpZiAodGhpcy5wcm9wZXJ0aWVzLnZlcnRpY2FsX2FsaWduID09ICdib3R0b20nKSB7XG5cdFx0cG9zaXRpb24ueSA9IC0oZm9udF9oZWlnaHQpICogc2NhbGU7XG5cdH1cblxuXHRfKHRoaXMucHJvcGVydGllcy50ZXh0KS5lYWNoKGZ1bmN0aW9uKGMsIGkpIHtcblx0XHRpZiAoYyA9PT0gJyAnKSByZXR1cm47XG5cblx0XHQvL3ZhciBnbHlwaElEID0gZ2x5cGhNYXBbYy50b1VwcGVyQ2FzZSgpXSB8fCAnY2hhci1wZXJpb2QnO1xuXHRcdHZhciBnbHlwaElEID0gZ2x5cGhNYXBbY10gfHwgJ2NoYXItcGVyaW9kJztcblx0XHR2YXIgZ2x5cGhTVkcgPSAkKFwiI1wiK2dseXBoSUQsIGZvbnQpLmdldCgwKTtcblx0XHR2YXIgZ2x5cGggPSBuZXcgcGFwZXIuR3JvdXAoKTtcblxuXHRcdGdseXBoLmltcG9ydFNWRyhnbHlwaFNWRywge1xuXHRcdFx0ZXhwYW5kU2hhcGVzOiB0cnVlXG5cdFx0fSk7XG5cblx0XHRnbHlwaC5zY2FsZShzY2FsZSwgbmV3IHBhcGVyLlBvaW50KDAsMCkpO1xuXHRcdGdseXBoLnRyYW5zbGF0ZShwb3NpdGlvbik7XG5cdFx0Z2x5cGgudHJhbnNsYXRlKGkgKiAoZm9udF93aWR0aCArIGZvbnRfc3BhY2luZykgKiBzY2FsZSwgMCk7XG5cdFx0dGV4dEdyb3VwLmFkZENoaWxkKGdseXBoKTtcblxuXHR9LCB0aGlzKTtcblxuXG5cblx0cmV0dXJuIHRleHRHcm91cDtcbn07XG5cblxuVGV4dC5wcm90b3R5cGUuZHJhd0J1aWxkID0gZnVuY3Rpb24oX2JvdW5kcykge1xuXHRcblx0cmV0dXJuIHRoaXMuZHJhd0JvdW5kcyhfYm91bmRzKTtcblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMuUmVnaW9uID0gcmVxdWlyZSgnLi9SZWdpb24uanMnKTtcbm1vZHVsZS5leHBvcnRzLkRvY3VtZW50ID0gcmVxdWlyZSgnLi9Eb2N1bWVudC5qcycpO1xubW9kdWxlLmV4cG9ydHMuUmVjdGFuZ2xlID0gcmVxdWlyZSgnLi9SZWN0YW5nbGUuanMnKTtcbm1vZHVsZS5leHBvcnRzLkVsbGlwc2UgPSByZXF1aXJlKCcuL0VsbGlwc2UuanMnKTtcbm1vZHVsZS5leHBvcnRzLlJlZ2lvbkdyaWQgPSByZXF1aXJlKCcuL1JlZ2lvbkdyaWQuanMnKTtcbm1vZHVsZS5leHBvcnRzLlRleHQgPSByZXF1aXJlKCcuL1RleHQuanMnKTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbm1vZHVsZS5leHBvcnRzLmZpbGVVUkwgPSBcIi4vZXhhbXBsZXMvZHJhd2JvdC55YW1sXCI7XG4vLyBtb2R1bGUuZXhwb3J0cy5maWxlVVJMID0gXCIuLi95YW1sL3RyaWNreV9ncmlkLnlhbWxcIjtcbm1vZHVsZS5leHBvcnRzLnByZXZpZXdDYW52YXNXaWR0aCA9IDEyMDA7XG5tb2R1bGUuZXhwb3J0cy5wcmV2aWV3Q2FudmFzSGVpZ2h0ID0gMTIwMDtcbm1vZHVsZS5leHBvcnRzLmluc3BlY3RPbkhvdmVyID0gZmFsc2U7XG5cblxuXG4vL2NvbG9yc1xudmFyIHNoYXBlRmlsbENvbG9yID0gbmV3IHBhcGVyLkNvbG9yKDAuNCwgLjQsIDAuNCwgMC40KTtcbnZhciBzaGFwZVN0cm9rZUNvbG9yID0gbmV3IHBhcGVyLkNvbG9yKDAuMCwwLjAsMC4wLCAwLjE1KTtcbnZhciBib3VuZHNTdHJva2VDb2xvciA9IG5ldyBwYXBlci5Db2xvcigwLjAsIDEuMCwgMS4wLCAwLjc1KTtcbnZhciBoaWdobGlnaHRDb2xvciA9IG5ldyBwYXBlci5Db2xvcihcIiNmOTI3NzJcIik7XG5cbi8vIENyZWF0ZSBEZWZhdWx0IFN0eWxlXG52YXIgZGVmYXVsdFN0eWxlID0ge1xuXHRzdHJva2VTY2FsaW5nOiBmYWxzZSxcblx0c3Ryb2tlQ29sb3I6IFwiYmxhY2tcIixcblx0c3Ryb2tlV2lkdGg6IDEsXG5cdGZpbGxDb2xvcjogbmV3IHBhcGVyLkNvbG9yKDAsIDAsIDAsIDApLFxuXHRkYXNoQXJyYXk6IFtdXG59O1xuXG52YXIgZGVmYXVsdFN0eWxlcyA9IHt9O1xuZGVmYXVsdFN0eWxlcy5kZWZhdWx0ID0gXyhkZWZhdWx0U3R5bGUpLmNsb25lKCk7XG5kZWZhdWx0U3R5bGVzLnNlbGVjdGVkID0gXyhkZWZhdWx0U3R5bGUpLmNsb25lKCk7XG5kZWZhdWx0U3R5bGVzLmtleSA9IF8oZGVmYXVsdFN0eWxlKS5jbG9uZSgpO1xuZGVmYXVsdFN0eWxlcy5naG9zdCA9IF8oZGVmYXVsdFN0eWxlKS5jbG9uZSgpO1xuZGVmYXVsdFN0eWxlcy5ob3ZlciA9IF8oZGVmYXVsdFN0eWxlKS5jbG9uZSgpO1xuXG5cbi8vIENyZWF0ZSBCdWlsZCBTdHlsZVxudmFyIGJ1aWxkU3R5bGUgPSBfKGRlZmF1bHRTdHlsZSkuY2xvbmUoKTtcbl8oYnVpbGRTdHlsZSkuZXh0ZW5kKHtcblx0ZmlsbENvbG9yOiBzaGFwZUZpbGxDb2xvcixcblx0c3Ryb2tlQ29sb3I6IG5ldyBwYXBlci5Db2xvcigwLjAsMC4wLDAuMCwgMC41KSxcblx0c3Ryb2tlV2lkdGg6IDJcbn0pO1xuXG4vLyBDcmVhdGUgRXhwb3J0IFN0eWxlXG52YXIgZXhwb3J0U3R5bGUgPSBfKGRlZmF1bHRTdHlsZSkuY2xvbmUoKTtcbl8oZXhwb3J0U3R5bGUpLmV4dGVuZCh7fSk7XG5cblxuLy8gQ3JlYXRlIFByZXZpZXcvRnJhbWUgU3R5bGUgLSBCb3VuZHNcbnZhciBzdHlsZXMgPSB7fTtcbnN0eWxlcy5ib3VuZHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdFN0eWxlcyk7XG5fKHN0eWxlcy5ib3VuZHMuZGVmYXVsdCkuZXh0ZW5kKHtcblx0c3Ryb2tlQ29sb3I6IGJvdW5kc1N0cm9rZUNvbG9yXG59KTtcbl8oc3R5bGVzLmJvdW5kcy5zZWxlY3RlZCkuZXh0ZW5kKHtcblx0c3Ryb2tlQ29sb3I6IGhpZ2hsaWdodENvbG9yLFxuXHRzdHJva2VXaWR0aDogMVxufSk7XG5fKHN0eWxlcy5ib3VuZHMua2V5KS5leHRlbmQoe1xuXHRzdHJva2VDb2xvcjogaGlnaGxpZ2h0Q29sb3IsXG5cdHN0cm9rZVdpZHRoOiAzXG59KTtcbl8oc3R5bGVzLmJvdW5kcy5naG9zdCkuZXh0ZW5kKHt9KTtcbl8oc3R5bGVzLmJvdW5kcy5ob3ZlcikuZXh0ZW5kKHtcblx0c3Ryb2tlQ29sb3I6IFwiYmxhY2tcIixcblx0c3Ryb2tlV2lkdGg6IDNcbn0pO1xuXG4vLyBDcmVhdGUgUHJldmlldy9GcmFtZSBTdHlsZSAtIFNoYXBlXG5zdHlsZXMuc2hhcGUgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc3R5bGVzLmJvdW5kcyk7XG5fKHN0eWxlcy5zaGFwZS5kZWZhdWx0KS5leHRlbmQoe1xuXHRzdHJva2VDb2xvcjogc2hhcGVTdHJva2VDb2xvcixcbn0pO1xuXyhzdHlsZXMuc2hhcGUuc2VsZWN0ZWQpLmV4dGVuZCh7fSk7XG5fKHN0eWxlcy5zaGFwZS5rZXkpLmV4dGVuZCh7fSk7XG5fKHN0eWxlcy5zaGFwZS5naG9zdCkuZXh0ZW5kKHt9KTtcbl8oc3R5bGVzLnNoYXBlLmhvdmVyKS5leHRlbmQoe30pO1xuXG4vLyBDcmVhdGUgUHJldmlldy9GcmFtZSBTdHlsZSAtIFNoYXBlXG5zdHlsZXMucG9zaXRpb24gPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdFN0eWxlcyk7XG5cblxubW9kdWxlLmV4cG9ydHMuc3R5bGVzID0gc3R5bGVzO1xubW9kdWxlLmV4cG9ydHMuZXhwb3J0U3R5bGUgPSBleHBvcnRTdHlsZTtcbm1vZHVsZS5leHBvcnRzLmJ1aWxkU3R5bGUgPSBidWlsZFN0eWxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2c7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBMb2dcblxuZnVuY3Rpb24gTG9nKCkge1xuXG5cdHRoaXMuZGVidWdUZW1wbGF0ZSA9XG5cdFx0Xy50ZW1wbGF0ZSgnPGxpIGNsYXNzID0gXCJkZWJ1Z1wiPjxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSBtZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblx0dGhpcy5zdWNjZXNzVGVtcGxhdGUgPVxuXHRcdF8udGVtcGxhdGUoJzxsaSBjbGFzcyA9IFwic3VjY2Vzc1wiPjxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSBtZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblx0dGhpcy5tZXNzYWdlVGVtcGxhdGUgPVxuXHRcdF8udGVtcGxhdGUoJzxsaSBjbGFzcyA9IFwibWVzc2FnZVwiPjxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSBtZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblx0dGhpcy53YXJuaW5nVGVtcGxhdGUgPVxuXHRcdF8udGVtcGxhdGUoJzxsaSBjbGFzcyA9IFwid2FybmluZ1wiPjxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSBtZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblx0dGhpcy5lcnJvclRlbXBsYXRlID1cblx0XHRfLnRlbXBsYXRlKCc8bGkgY2xhc3MgPSBcImVycm9yXCI+PHNwYW4gY2xhc3M9XCJtZXNzYWdlXCI+PCU9IG1lc3NhZ2UgJT48L3NwYW4+PC9saT4nKTtcblxuXHR0aGlzLnBhcnNlRXJyb3JUZW1wbGF0ZSA9XG5cdFx0Xy50ZW1wbGF0ZSgnPGxpIGNsYXNzID0gXCJlcnJvclwiPjxzcGFuIGNsYXNzPVwibGluZVwiPkxpbmUgPCU9IG1hcmsubGluZSArIDEgJT48L3NwYW4+IDxzcGFuIGNsYXNzPVwibWVzc2FnZVwiPjwlPSByZWFzb24gJT48L3NwYW4+PC9saT4nKTtcblxuXHR0aGlzLmV4Y2VwdGlvblRlbXBsYXRlID1cblx0XHRfLnRlbXBsYXRlKCc8bGkgY2xhc3MgPSBcImVycm9yXCI+PHNwYW4gY2xhc3M9XCJtZXNzYWdlXCI+PCU9IG1lc3NhZ2UgJT48YnIgLz5FeGNlcHRpb24gb2NjdXJyZWQ6ICA8JT0gZS5tZXNzYWdlICU+PC9zcGFuPjwvbGk+Jyk7XG5cblxufVxuXG52YXIgc2hhcmVkO1xuTG9nLnNoYXJlZEluc3RhbmNlID0gZnVuY3Rpb24oKSB7XG5cdHNoYXJlZCA9IHNoYXJlZCB8fCBuZXcgTG9nKCk7IFxuXHRyZXR1cm4gc2hhcmVkO1xufTtcblxuTG9nLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKF9tZXNzYWdlKSB7XG5cdCQoXCIjbG9nXCIpLmVtcHR5KCk7XG59O1xuXG5mdW5jdGlvbiBzdHJpbmdBcmd1bWVudHMoX2FyZ3VtZW50cykge1xuXHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKF9hcmd1bWVudHMpO1xuXHRyZXR1cm4gYXJncy5qb2luKFwiIFwiKTtcbn1cblxuTG9nLnByb3RvdHlwZS5hcHBlbmREZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuXHQkKFwiI2xvZ1wiKS5hcHBlbmQodGhpcy5kZWJ1Z1RlbXBsYXRlKHtcblx0XHRtZXNzYWdlOiBzdHJpbmdBcmd1bWVudHMoYXJndW1lbnRzKVxuXHR9KSk7XG5cdHZhciBkID0gJCgnI2xvZycpO1xuXHRkLnNjcm9sbFRvcChkLnByb3AoXCJzY3JvbGxIZWlnaHRcIikpO1xuXG59O1xuXG5Mb2cucHJvdG90eXBlLmFwcGVuZFN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcblx0JChcIiNsb2dcIikuYXBwZW5kKHRoaXMuc3VjY2Vzc1RlbXBsYXRlKHtcblx0XHRtZXNzYWdlOiBzdHJpbmdBcmd1bWVudHMoYXJndW1lbnRzKVxuXHR9KSk7XG59O1xuXG5Mb2cucHJvdG90eXBlLmFwcGVuZE1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcblx0JChcIiNsb2dcIikuYXBwZW5kKHRoaXMubWVzc2FnZVRlbXBsYXRlKHtcblx0XHRtZXNzYWdlOiBzdHJpbmdBcmd1bWVudHMoYXJndW1lbnRzKVxuXHR9KSk7XG59O1xuXG5Mb2cucHJvdG90eXBlLmFwcGVuZFdhcm5pbmcgPSBmdW5jdGlvbigpIHtcblx0JChcIiNsb2dcIikuYXBwZW5kKHRoaXMud2FybmluZ1RlbXBsYXRlKHtcblx0XHRtZXNzYWdlOiBzdHJpbmdBcmd1bWVudHMoYXJndW1lbnRzKVxuXHR9KSk7XG59O1xuXG5Mb2cucHJvdG90eXBlLmFwcGVuZEVycm9yID0gZnVuY3Rpb24oKSB7XG5cdCQoXCIjbG9nXCIpLmFwcGVuZCh0aGlzLmVycm9yVGVtcGxhdGUoe1xuXHRcdG1lc3NhZ2U6IHN0cmluZ0FyZ3VtZW50cyhhcmd1bWVudHMpXG5cdH0pKTtcbn07XG5cbkxvZy5wcm90b3R5cGUuYXBwZW5kUGFyc2VFcnJvciA9IGZ1bmN0aW9uKF9ZQU1MRXhjZXB0aW9uKSB7XG5cdCQoXCIjbG9nXCIpLmFwcGVuZCh0aGlzLnBhcnNlRXJyb3JUZW1wbGF0ZShfWUFNTEV4Y2VwdGlvbikpO1xuXHQvL3RvZG8gYWRkIGNsaWNrIHRvIHRoaXNcbn07XG5cbkxvZy5wcm90b3R5cGUuYXBwZW5kRXhjZXB0aW9uID0gZnVuY3Rpb24oX2UsIF9tZXNzYWdlKSB7XG5cblx0JChcIiNsb2dcIikuYXBwZW5kKHRoaXMuZXhjZXB0aW9uVGVtcGxhdGUoe2U6IF9lLCBtZXNzYWdlOiBfbWVzc2FnZX0pKTtcblx0Ly90b2RvIGFkZCBjbGljayB0byB0aGlzXG59O1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb250ZXh0ID0gcmVxdWlyZSgnLi4vQ29udGV4dC5qcycpO1xudmFyIGxhbmd1YWdlID0gcmVxdWlyZSgnLi4vbGFuZ3VhZ2UuanMnKTtcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL3NldHRpbmdzLmpzJyk7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcmV2aWV3O1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBQcmV2aWV3XG5cbmZ1bmN0aW9uIFByZXZpZXcoKSB7XG5cdHRoaXMucHJldmlld0xheWVyID0gbnVsbDtcblx0dGhpcy5idWlsZExheWVyID0gbnVsbDtcblx0dGhpcy5leHBvcnRMYXllciA9IG51bGw7XG5cblx0dGhpcy5kb2MgPSBudWxsO1xuXG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXHQkLlRvcGljKFwiVUkvY29tbWFuZC90b2dnbGVWaWV3UHJldmlld1wiKS5zdWJzY3JpYmUoXG5cdFx0ZnVuY3Rpb24oX3N0YXRlKSB7XG5cdFx0XHRpZiAoX3N0YXRlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0X3N0YXRlID0gIXNlbGYucHJldmlld0xheWVyLnZpc2libGU7XG5cdFx0XHR9XG5cdFx0XHRzZWxmLnByZXZpZXdMYXllci52aXNpYmxlID0gX3N0YXRlO1xuXHRcdFx0cGFwZXIudmlldy51cGRhdGUoKTtcblx0XHR9XG5cdCk7XG5cdCQuVG9waWMoXCJVSS9jb21tYW5kL3RvZ2dsZVZpZXdCdWlsZFwiKS5zdWJzY3JpYmUoXG5cdFx0ZnVuY3Rpb24oX3N0YXRlKSB7XG5cdFx0XHRpZiAoX3N0YXRlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0X3N0YXRlID0gIXNlbGYuYnVpbGRMYXllci52aXNpYmxlO1xuXHRcdFx0fVxuXHRcdFx0c2VsZi5idWlsZExheWVyLnZpc2libGUgPSBfc3RhdGU7XG5cdFx0XHRwYXBlci52aWV3LnVwZGF0ZSgpO1xuXHRcdH1cblx0KTtcblx0JC5Ub3BpYyhcIlVJL2NvbW1hbmQvdG9nZ2xlVmlld0V4cG9ydFwiKS5zdWJzY3JpYmUoXG5cdFx0ZnVuY3Rpb24oX3N0YXRlKSB7XG5cdFx0XHRpZiAoX3N0YXRlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0X3N0YXRlID0gIXNlbGYuZXhwb3J0TGF5ZXIudmlzaWJsZTtcblx0XHRcdH1cblx0XHRcdHNlbGYuZXhwb3J0TGF5ZXIudmlzaWJsZSA9IF9zdGF0ZTtcblx0XHRcdHBhcGVyLnZpZXcudXBkYXRlKCk7XG5cdFx0fVxuXHQpO1xuXG5cblxufVxuXG5QcmV2aWV3LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oX2VsZW1lbnQpIHtcblx0cGFwZXIuc2V0dXAoX2VsZW1lbnQpO1xuXHR0aGlzLmJ1aWxkTGF5ZXIgPSBuZXcgcGFwZXIuTGF5ZXIoKTtcblx0dGhpcy5leHBvcnRMYXllciA9IG5ldyBwYXBlci5MYXllcigpO1xuXHR0aGlzLnByZXZpZXdMYXllciA9IG5ldyBwYXBlci5MYXllcigpO1xuXG5cdHZhciBkcmFnID0gZmFsc2U7XG5cdHZhciBsYXN0TW91c2U7XG5cblx0Ly8gaGFuZGxlIGRyYWdnaW5nL3Bhbm5pbmdcblx0JChwYXBlci52aWV3LmVsZW1lbnQpLm1vdXNlZG93bihmdW5jdGlvbihfZSkge1xuXHRcdGRyYWcgPSB0cnVlO1xuXHRcdGxhc3RNb3VzZSA9IG5ldyBwYXBlci5Qb2ludChfZS5vcmlnaW5hbEV2ZW50LnNjcmVlblgsIF9lLm9yaWdpbmFsRXZlbnQuc2NyZWVuWSk7XG5cdH0pO1xuXG5cdCQod2luZG93KS5tb3VzZXVwKGZ1bmN0aW9uKF9lKSB7XG5cdFx0ZHJhZyA9IGZhbHNlO1xuXHR9KTtcblxuXHQkKHdpbmRvdykubW91c2Vtb3ZlKGZ1bmN0aW9uKF9lKSB7XG5cdFx0aWYgKCFkcmFnKSByZXR1cm47XG5cdFx0dmFyIHRoaXNNb3VzZSA9IG5ldyBwYXBlci5Qb2ludChfZS5vcmlnaW5hbEV2ZW50LnNjcmVlblgsIF9lLm9yaWdpbmFsRXZlbnQuc2NyZWVuWSk7XG5cdFx0cGFwZXIudmlldy5zY3JvbGxCeShsYXN0TW91c2Uuc3VidHJhY3QodGhpc01vdXNlKSk7XG5cdFx0bGFzdE1vdXNlID0gdGhpc01vdXNlO1xuXHR9KTtcblxufTtcblxuUHJldmlldy5wcm90b3R5cGUuc2V0RG9jdW1lbnQgPSBmdW5jdGlvbihfZG9jKSB7XG5cdHRoaXMuZG9jID0gX2RvYztcblxuXHR2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KCk7XG5cdHZhciB1bml0ID0gbGFuZ3VhZ2UudW5pdFNjYWxlc1t0aGlzLmRvYy5wcm9wZXJ0aWVzLnVuaXRdIHx8IDE7XG5cdGNvbnRleHQubWF0cml4LnNjYWxlKHVuaXQpO1xuXHQvLyBtb2R1bGUuZXhwb3J0cy5pbnNwZWN0b3Iuc2V0VW5pdCh0aGlzLmRvYy5wcm9wZXJ0aWVzLnVuaXQpO1xuXG5cdC8vIGRyYXcgcHJldmlldy9mcmFtZVxuXHR0aGlzLnByZXZpZXdMYXllci5yZW1vdmVDaGlsZHJlbigpO1xuXHRwYXBlci5wcm9qZWN0LmFjdGl2ZUxheWVyID0gdGhpcy5wcmV2aWV3TGF5ZXI7XG5cdHRoaXMuZG9jLnByZXZpZXcoY29udGV4dCk7XG5cblx0Ly8gZHJhdyBidWlsZFxuXHR0aGlzLmJ1aWxkTGF5ZXIucmVtb3ZlQ2hpbGRyZW4oKTtcblx0XG5cdHBhcGVyLnByb2plY3QuYWN0aXZlTGF5ZXIgPSB0aGlzLmJ1aWxkTGF5ZXI7XG5cdHZhciBidWlsZFNoYXBlcyA9IHRoaXMuZG9jLmJ1aWxkKGNvbnRleHQpO1xuXHR0aGlzLmJ1aWxkTGF5ZXIuc3R5bGUgPSBzZXR0aW5ncy5idWlsZFN0eWxlO1xuXHRcblx0Ly8gY29uc29sZS5sb2coXCJjaGlsZHNcIiwgdGhpcy5idWlsZExheWVyLmNoaWxkcmVuKTtcblx0Ly8gY29uc29sZS5sb2coXCJidWlsZFNoYXBlc1wiLCBidWlsZFNoYXBlcyk7XG5cdF8oYnVpbGRTaGFwZXMpLmVhY2goZnVuY3Rpb24oc2hhcGUpIHtcblx0XHRpZiAoc2hhcGUgaW5zdGFuY2VvZiBwYXBlci5QYXRoKSByZXR1cm47XG5cdFx0aWYgKHNoYXBlIGluc3RhbmNlb2YgcGFwZXIuQ29tcG91bmRQYXRoKSByZXR1cm47XG5cdFx0Ly8gc3R5bGUgdHlwZVxuXHRcdC8vIHNoYXBlLnN0eWxlID0gc2V0dGluZ3MuYnVpbGRTdHlsZTtcblx0XHRjb25zb2xlLmxvZyhcInNoYXBlLFwiLCBzaGFwZSk7XG5cdFx0c2hhcGUuc3R5bGUgPSBcblx0XHR7XG5cdFx0XHRmaWxsQ29sb3I6IHVuZGVmaW5lZCxcblx0XHRcdHN0cm9rZVdpZHRoOiAxLFxuXHRcdFx0c3Ryb2tlQ29sb3I6IFwicmVkXCJcblx0XHR9O1xuXHR9KTtcblxuXHQvLyBkcmF3IGV4cG9ydFxuXHR0aGlzLmV4cG9ydExheWVyLnJlbW92ZUNoaWxkcmVuKCk7XG5cdHBhcGVyLnByb2plY3QuYWN0aXZlTGF5ZXIgPSB0aGlzLmV4cG9ydExheWVyO1xuXHR0aGlzLmRvYy5idWlsZChjb250ZXh0KTtcblx0dGhpcy5leHBvcnRMYXllci5zdHlsZSA9IHNldHRpbmdzLmV4cG9ydFN0eWxlO1xuXG5cblx0cGFwZXIudmlldy5jZW50ZXIgPSBuZXcgcGFwZXIuUG9pbnQoX2RvYy5wcm9wZXJ0aWVzLndpZHRoICogMC41ICogdW5pdCwgX2RvYy5wcm9wZXJ0aWVzLmhlaWdodCAqIDAuNSAqIHVuaXQpO1xuXHRwYXBlci52aWV3LnVwZGF0ZSgpO1xuXG59O1xuXG5QcmV2aWV3LnByb3RvdHlwZS5yZWRyYXcgPSBmdW5jdGlvbigpIHtcblx0cGFwZXIudmlldy51cGRhdGUoKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG52YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuXG5cblxubW9kdWxlLmV4cG9ydHMuZG93bmxvYWREYXRhVXJpID0gZnVuY3Rpb24oX2ZpbGVuYW1lLCBfZGF0YSkge1xuXHR2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXHRsaW5rLmRvd25sb2FkID0gX2ZpbGVuYW1lO1xuXHRsaW5rLmhyZWYgPSBfZGF0YTtcblx0Y29uc29sZS5sb2cobGluayk7XG5cdGxpbmsuY2xpY2soKTtcbn07XG5cblxuLy8gZ2l2ZW4gYSBvYmplY3QgdHJlZSBhbmQgdGhlIG5hbWUgb2YgYSBrZXkgdGhhdCBob2xkcyBhbiBhcnJheSBvZiBjaGlsZHJlbiBpbiBlYWNoIG9iamVjdCwgcmV0dXJucyBhIGZsYXQgYXJyYXkgb2YgYWxsIGRlY2VuZGFudHNcbm1vZHVsZS5leHBvcnRzLmNvbGxlY3RUcmVlID0gZnVuY3Rpb24oX25vZGUsIF9rZXkpIHtcblx0dmFyIGMgPSBbX25vZGVdO1xuXHRfKF9ub2RlW19rZXldKS5lYWNoKFxuXHRcdGZ1bmN0aW9uKF9jaGlsZE5vZGUpIHtcblx0XHRcdGMgPSBjLmNvbmNhdChtb2R1bGUuZXhwb3J0cy5jb2xsZWN0VHJlZShfY2hpbGROb2RlLCBfa2V5KSk7XG5cdFx0fVxuXHQpO1xuXHRyZXR1cm4gYztcbn07XG5cblxuLy8gZ2l2ZW4gdHdvIGFycmF5cyBvZiBvYmplY3RzLCBhZGRzIG9iamVjdHMgZnJvbSBfbmV3IHRvIF9iYXNlIHJlcGxhY2luZyBvYmplY3RzIHdpdGggbWF0Y2hpbmcgX2tleSBwcm9wZXJ0eSwgcmV0dXJucyByZXN1bHRzXG4vLyBkb2VzIG5vdCBwcmVzZXJ2ZSBvcmRlclxuLy8gW3tuYW1lOiBhYmUsIGFnZTogMzB9LCB7bmFtZTogYmV0aCwgYWdlOiAzMH1dICwgW3tuYW1lOiBhYmUsIGFnZTogMzF9LCB7bmFtZTogY2F0aHksIGFnZTogMjZ9XSwgXCJuYW1lXCJcbi8vIFt7bmFtZTogYmV0aCwgYWdlOiAzMH0sIHtuYW1lOiBhYmUsIGFnZTogMzF9LCB7bmFtZTogY2F0aHksIGFnZTogMjZ9XVxuXG5tb2R1bGUuZXhwb3J0cy5tZXJnZU9iamVjdEFycmF5c09uS2V5ID0gZnVuY3Rpb24oX2Jhc2UsIF9uZXcsIF9rZXkpIHtcblx0XG5cdF9iYXNlID0gXyhfYmFzZSkuZmlsdGVyKGZ1bmN0aW9uKF9iYXNlT2JqZWN0KXtcblx0XHR2YXIgb3ZlcnJpZGRlbiA9IF8oX25ldykuZmluZCggZnVuY3Rpb24oX25ld09iamVjdCkge1xuXHRcdFx0cmV0dXJuIF9uZXdPYmplY3RbX2tleV0gPT09IF9iYXNlT2JqZWN0W19rZXldO1xuXHRcdH0pO1xuXHRcdHJldHVybiAhb3ZlcnJpZGRlbjtcblx0fSk7XG5cblx0cmV0dXJuIF9iYXNlLmNvbmNhdChfbmV3KTtcbn1cblxuIl19
