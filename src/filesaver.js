/* Copyright 2017 Tristian Flanagan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

(function(factory){
	'use strict';

	if(typeof(define) === 'function' && define.amd){
		define('FileSaver', [], factory);
	}else
	if(typeof module !== 'undefined' && module.exports){
		module.exports = factory();
	}else{
		window.FileSaver = factory();
	}
})(function(){
	'use strict';

	var FileSaver = function(blob, noAutoBom){
		this.blob = blob;
		this.noAutoBom = noAutoBom || false;

		return this;
	};

	FileSaver.prototype.save = function(name){
		if(!this.noAutoBom){
			this.blob = FileSaver.autoBom(this.blob);
		}

		name = name || this.blob.name || 'download';

		if(typeof(navigator) !== 'undefined' && navigator.msSaveOrOpenBlob){
			return navigator.msSaveOrOpenBlob(this.blob, name);
		}

		var that = this,
			saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a'),
			force = this.blob.type === 'application/octet-stream',
			objectUrl,
			fsError = function(){
				if((isChromeIos || (force && isSafari)) && window.FileReader){
					var reader = new FileReader();

					reader.onloadend = function() {
						var url = isChromeIos ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;'),
							popup = window.open(url, '_blank');

						if(!popup){
							window.location.href = url;
						}

						url = undefined;
					};

					reader.readAsDataURL(that.blob);

					return;
				}

				if(!objectUrl){
					objectUrl = FileSaver.getURL().createObjectURL(that.blob);
				}

				if(force){
					window.location.href = objectUrl;
				}else{
					var opened = window.open(objectUrl, '_blank');

					if(!opened){
						window.location.href = objectUrl;
					}
				}

				FileSaver.revoke(objectUrl);
			};

		if(typeof(saveLink.download) !== 'undefined'){
			objectUrl = FileSaver.getURL().createObjectURL(this.blob);

			setTimeout(function(){
				saveLink.href = objectUrl;
				saveLink.download = name;

				var event = new MouseEvent('click');

				saveLink.dispatchEvent(event);

				FileSaver.revoke(objectUrl);
			});

			return;
		}

		fsError();
	};

	FileSaver.autoBom = function(blob){
		if(/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)){
			return new Blob([
				String.fromCharCode(0xFEFF),
				blob
			], {
				type: blob.type
			});
		}

		return blob;
	};

	FileSaver.getURL = function(){
		return window.URL || window.webkitURL || window;
	};

	FileSaver.revoke = function(file){
		var revoker = function(){
			if(typeof(file) === 'string'){
				FileSaver.getURL().revokeObjectURL(file);
			}else{
				file.remove();
			}
		};

		setTimeout(revoker, 1000 * 40);
	};

	return FileSaver;
});
