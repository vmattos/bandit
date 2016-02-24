'use strict'

var fs = require('fs')
  , S = require('string')

const _cloudConfig = Symbol('cloudConfig')
    , _lines = Symbol('lines')
    , _startingLine = Symbol('startingLine')

class Bandit {
  constructor(ccFile) {
    this._refRegexp = new RegExp('\\{[ ]?"Ref":[ ]?"[a-zA-Z0-9]+"[ ]?\\}');
    this._fnRegexp = new RegExp('\\{[ ]?"Fn::GetAtt":[ ]?\\[.*\\][ ]?\\}');

    this[_cloudConfig] = fs.readFileSync(ccFile);
    this[_lines] = S(this[_cloudConfig]).lines();
    this[_startingLine] = 0
  }

  /**************************************
   * Private methods                    *
   **************************************/

  _updateLines(lines, i, matcher, matches) {
    var cursor = lines[i];
    var lineSplit = cursor.split(matcher);
    var updatedLine = lineSplit[0];
    var firstMatch = matches[0];
    var secondPart = lines[i].split(updatedLine + firstMatch)[1];

    var updatedLines = [...lines]

    updatedLines[i] = updatedLine;
    updatedLines.splice(i+1, 0, JSON.parse(firstMatch));
    updatedLines.splice(i+2, 0, secondPart);

    return updatedLines
  }

  _parse(lines, i) {
    var cursor = lines[i];
    if(typeof cursor === 'undefined') return lines;
    if(typeof cursor === 'string') {
      var refMatch = cursor.match(this._refRegexp);
      var fnMatch = cursor.match(this._fnRegexp);

      if(refMatch) lines = this._updateLines(lines, i, this._refRegexp, refMatch);
      else if(fnMatch) lines = this._updateLines(lines, i, this._fnRegexp, fnMatch);
      else lines[i] = lines[i] + '\n';
    }

    return this._parse(lines, i+1);
  }

  /**************************************
   * Public methods                     *
   **************************************/

  parse() {
    var lines = this[_lines];
    var i = this[_startingLine];

    return this._parse(lines, i);
  }
}

module.exports = Bandit;
