/*
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://bitbucket.org/fbennett/citeproc-js/src/tip/LICENSE.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is the citation formatting software known as
 * "citeproc-js" (an implementation of the Citation Style Language
 * [CSL]), including the original test fixtures and software located
 * under the ./std subdirectory of the distribution archive.
 *
 * The Original Developer is not the Initial Developer and is
 * __________. If left blank, the Original Developer is the Initial
 * Developer.
 *
 * The Initial Developer of the Original Code is Frank G. Bennett,
 * Jr. All portions of the code written by Frank G. Bennett, Jr. are
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
 */

/*
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
 *
 * The contents of this file are subject to the Common Public
 * Attribution License Version 1.0 (the “License”); you may not use
 * this file except in compliance with the License. You may obtain a
 * copy of the License at:
 *
 * http://bitbucket.org/fbennett/citeproc-js/src/tip/LICENSE.
 *
 * The License is based on the Mozilla Public License Version 1.1 but
 * Sections 14 and 15 have been added to cover use of software over a
 * computer network and provide for limited attribution for the
 * Original Developer. In addition, Exhibit A has been modified to be
 * consistent with Exhibit B.
 *
 * Software distributed under the License is distributed on an “AS IS”
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is the citation formatting software known as
 * "citeproc-js" (an implementation of the Citation Style Language
 * [CSL]), including the original test fixtures and software located
 * under the ./std subdirectory of the distribution archive.
 *
 * The Original Developer is not the Initial Developer and is
 * __________. If left blank, the Original Developer is the Initial
 * Developer.
 *
 * The Initial Developer of the Original Code is Frank G. Bennett,
 * Jr. All portions of the code written by Frank G. Bennett, Jr. are
 * Copyright (c) 2009 and 2010 Frank G. Bennett, Jr. All Rights Reserved.
 */

CSL.Engine.prototype.makeBibliography = function (bibsection) {
	var debug, ret, params, maxoffset, item, len, pos, tok, tokk, tokkk;
	debug = false;
	//SNIP-START
	if (debug) {
		len = this.bibliography.tokens.length;
		for (pos = 0; pos < len; pos += 1) {
			tok = this.bibliography.tokens[pos];
			CSL.debug("bibtok: " + tok.name);
		}
		CSL.debug("---");
		len = this.citation.tokens.length;
		for (pos = 0; pos < len; pos += 1) {
			tokk = this.citation.tokens[pos];
			CSL.debug("cittok: " + tok.name);
		}
		CSL.debug("---");
		len = this.bibliography_sort.tokens.length;
		for (pos = 0; pos < len; pos += 1) {
			tokkk = this.bibliography_sort.tokens[pos];
			CSL.debug("bibsorttok: " + tok.name);
		}
	}
	//SNIP-END
	ret = CSL.getBibliographyEntries.call(this, bibsection);
	params = {
		"maxoffset": 0,
		"entryspacing": 0,
		"linespacing": 0,
		"second-field-align": false
	};
	if (this.bibliography.opt["second-field-align"]) {
		params["second-field-align"] = this.bibliography.opt["second-field-align"];
	}
	maxoffset = 0;
	len = this.registry.reflist.length;
	for (pos = 0; pos < len; pos += 1) {
		item = this.registry.reflist[pos];
		if (item.offset > params.maxoffset) {
			params.maxoffset = item.offset;
		}
	}
	if (this.bibliography.opt.hangingindent) {
		params.hangingindent = this.bibliography.opt.hangingindent;
	}
	if (this.bibliography.opt.entryspacing) {
		params.entryspacing = this.bibliography.opt.entryspacing;
	}
	if (this.bibliography.opt.linespacing) {
		params.linespacing = this.bibliography.opt.linespacing;
	}
	params.bibstart = this.fun.decorate.bibstart;
	params.bibend = this.fun.decorate.bibend;
	return [params, ret];
};

/*
 * Compose individual cites into a single string.
 */
CSL.getBibliographyEntries = function (bibsection) {
	var ret, input, include, anymatch, allmatch, bib_entry, res, len, pos, item, llen, ppos, spec, lllen, pppos, bib_layout, topblobs, cites, debug, collapse_parallel;
	ret = [];
	this.tmp.area = "bibliography";
	input = this.retrieveItems(this.registry.getSortedIds());
	this.tmp.disambig_override = true;
	function eval_string(a, b) {
		if (a === b) {
			return true;
		}
		return false;
	}
	function eval_list(a, lst) {
		lllen = lst.length;
		for (pppos = 0; pppos < lllen; pppos += 1) {
			if (eval_string(a, lst[pppos])) {
				return true;
			}
		}
		return false;
	}
	function eval_spec(a, b) {
		if ((a === "none" || !a) && !b) {
			return true;
		}
		if ("string" === typeof b) {
			return eval_string(a, b);
		} else if (!b) {
			return false;
		} else {
			return eval_list(a, b);
		}
	}

	var skips = {};
	len = input.length;
	for (pos = 0; pos < len; pos += 1) {
		item = input[pos];
		if (skips[item.id]) {
			continue;
		}
		if (bibsection) {
			include = true;
			if (bibsection.include) {
				//
				// Opt-in: these are OR-ed.
				//
				include = false;
				llen = bibsection.include.length;
				for (ppos = 0; ppos < llen; ppos += 1) {
					spec = bibsection.include[ppos];
					if (eval_spec(spec.value, item[spec.field])) {
						include = true;
						break;
					}
				}
			} else if (bibsection.exclude) {
				//
				// Opt-out: these are also OR-ed.
				//
				anymatch = false;
				llen = bibsection.exclude.length;
				for (ppos = 0; ppos < llen; ppos += 1) {
					spec = bibsection.exclude[ppos];
					if (eval_spec(spec.value, item[spec.field])) {
						anymatch = true;
						break;
					}
				}
				if (anymatch) {
					include = false;
				}
			} else if (bibsection.select) {
				//
				// Multiple condition opt-in: these are AND-ed.
				//
				include = false;
				allmatch = true;
				llen = bibsection.select.length;
				for (ppos = 0; ppos < llen; ppos += 1) {
					spec = bibsection.select[ppos];
					if (!eval_spec(spec.value, item[spec.field])) {
						allmatch = false;
					}
				}
				if (allmatch) {
					include = true;
				}
			}
			if (bibsection.quash) {
				//
				// Stop criteria: These are AND-ed.
				//
				allmatch = true;
				llen = bibsection.quash.length;
				for (ppos = 0; ppos < llen; ppos += 1) {
					spec = bibsection.quash[ppos];
					if (!eval_spec(spec.value, item[spec.field])) {
						allmatch = false;
					}
				}
				if (allmatch) {
					include = false;
				}
			}
			if (!include) {
				continue;
			}
		}
		//SNIP-START
		if (debug) {
			CSL.debug("BIB: " + item.id);
		}
		//SNIP-END
		bib_entry = new CSL.Token("group", CSL.START);
		bib_entry.decorations = [["@bibliography", "entry"]].concat(this[this.build.area].opt.layout_decorations);

		this.output.startTag("bib_entry", bib_entry);

		// The needs fixing.  Parallel cite should be generated
		// by arrival of either a master or a sibling, with the
		// same result.

		var sortedItems = [[{id: item.id}, item]];
		if (this.registry.registry[item.id].master) {
			collapse_parallel = true;
			this.parallel.StartCitation(sortedItems);
			this.output.queue[0].strings.delimiter = ", ";
			CSL.getCite.call(this, item);
			skips[item.id] = true;
			for each (i in this.registry.registry[item.id].siblings) {
				var eyetem = this.sys.retrieveItem(i);
				CSL.getCite.call(this, eyetem);
				skips[eyetem.id] = true;
			}
			this.parallel.ComposeSet();
			this.parallel.PruneOutputQueue();
		} else if (!this.registry.registry[item.id].siblings) {
			CSL.getCite.call(this, item);
			//skips[item.id] = true;
		}
		//
		// XXX: loop to render parallels goes here
		// XXX: just have to mark them somehow ...
		//
		this.output.endTag("bib_entry");
		//
		// place layout prefix on first blob of each cite, and suffix
		// on the last non-empty blob of each cite.  there be dragons
		// here.
		//
		if (this.output.queue[0].blobs.length && this.output.queue[0].blobs[0].blobs.length) {
			// The output queue stuff needs cleaning up.  the result of
			// output.current.value() is sometimes a blob, sometimes its list
			// of blobs.  this is inconsistency is a source of confusion, and
			// should be cleaned up across the code base in the first
			// instance, before making any other changes to output code.
			if (collapse_parallel) {
				topblobs = this.output.queue[0].blobs;
				collapse_parallel = false;
			} else {
				topblobs = this.output.queue[0].blobs[0].blobs;
			}
			llen = topblobs.length - 1;
			for (ppos = llen; ppos > -1; ppos += -1) {
				if (topblobs[ppos].blobs && topblobs[ppos].blobs.length !== 0) {
					topblobs[ppos].strings.suffix += this[this.build.area].opt.layout_suffix;
					break;
				}
			}
			topblobs[0].strings.prefix = this[this.build.area].opt.layout_prefix + topblobs[0].strings.prefix;
		}
		res = this.output.string(this, this.output.queue)[0];
		if (!res) {
			res = "[CSL STYLE ERROR: reference with no printed form.]";
		} else {
			ret.push(res);
		}
	}
	this.tmp.disambig_override = false;
	return ret;
};
