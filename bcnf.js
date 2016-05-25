function parseError( message) {
  this.message = message;
  this.name = "parseError";
}

function showError( error) {
  //Shows error to user. TODO:queue
  $("#warning").html('<strong>'+error.name+'</strong>: '+error.message);
  console.log(error);
  $("#warning").show().delay(5000).fadeOut();

};

function printDeps( deps) {
	for (var a in deps){
		if (deps.hasOwnProperty( a)){
			console.log("  "+a+"->"+deps[a]);
		}
	}
}

function arraySubtract(a, b){
	//console.log("diff "+a+" ; "+b);
	//subtracts b from a ....aka a - b
	var index;
	for (var i = 0; i < b.length; i++){
		index = a.indexOf(b[i]);
		if (index != -1)
			a.splice(index, 1);
	}
	//return a;
}
function arrayIn( a, b) {
	// b's elements are in a
	b.forEach( function(v) {
		if (a.indexOf(v) == -1)
			return false;
	});
	return true;
}
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function submitBCNF( e) {
  e.preventDefault();
  var data = $('#inputform :input').serializeArray();
  console.log(data);
  if (data[0].value != "" && data[1].value != "") {
    try {
      relation = parseRelation( data[0].value);
      dependencies = parseDependencies( data[1].value);
	  solveBCNF( relation, dependencies);
    }catch( e){
      showError( e);
    }
  }
}

function parseRelation( r) {
  //Input as A,B,C,D  parsed to array
  var relations = r.split(',');
  relations.forEach( function( v){ return v.trim()});
  
  return relations.sort();
  //String.prototype.trim.apply(null, relations);
}

function trimArray( a) {
	a.forEach( function( v){ return v.trim()});
	return a;
}
function parseDependencies( d) {
  //Input in form A->B, CD->E
  var deps = d.split(',');
  //deps.forEach( function( v){ return v.trim()});
  /* add ; and multiple elements A,B->C
  for (var i = 0; i < deps.length; i++){
	  deps[i].split(',');
	  trimArray(deps[i]);
  }
  */
  trimArray( deps);
  var dependencies = {};
  deps.forEach( function( v){
    var index = v.indexOf('->');
    if ( index == -1){
      throw new parseError('-> missing in "'+v+'"');
    }else {
      leftSide = v.substring( 0, index); 
      rightSide = v.substring( index+2).split(','); 
	  trimArray(rightSide);
	  // Check for nontrivial dependencies
	  // abc -> a always holds (right side subset of left)
	  for (var i = 0; i < rightSide.length; i++){
		  if ( leftSide.indexOf( rightSide[i]) == -1) {
			  // Found something that's nontrivial
			  // add it to dependencies
			  dependencies[ leftSide] = rightSide;
			  break;
		  }
	  }
      //var result = {};
	  //result[ leftSide] = rightSide;
	  //dependencies[ leftSide] = rightSide;
	  //dependencies.push()
      //result[ TODO:insert result into depencencies
      //dependencies.push( 
	  
    }
  });
  console.log(dependencies);
  return dependencies;
  
  
}

function closure( rel, dep, origRel) {
	// calculates closure of rel according to dep. If supplied origRel is used as attributes that closure must consist of
	var result = [];
	//copy rel into result
	rel.forEach(function(v){result.push(v);});
	//rel.forEach( function( v) {
	var iterating = true;
	var i = 0;
	//console.log("before:"+rel);
	while ( iterating){
		iterating = false;
		rel.forEach( function( v) {
			if (dep[v] != undefined){
				//peform array difference
				dep[v].forEach( function( u) {
				//dep[v] is array
					if (result.indexOf( u) == -1){
						if ( origRel == undefined || (origRel != undefined && origRel.indexOf( u) != -1)) {
							//console.log(u+" not in "+rel);
							result.push( u);
							//rel.concat( dep[v])
							iterating = true;		
						}
					}
				});
			}
		});
		//varotoimi
		i++;
		if (i>50){
			console.log("overlfow");
			break;
		}
	}
	//console.log("after:"+rel.sort());
	return result.sort();
	//});
	
}
function project( rel, dep) {
	//projects deps onto rel
	var depencencies = {};
	console.log("Projecting FD's onto "+rel)
	//create each subset of rel
	var subsets = [], subset, mask, i, total = Math.pow(2, rel.length)-1;
	var size = rel.length-1;
	//console.log("parting "+rel+" into subsets")
    for(mask = 1; mask < total; mask++){
        subset = [];
        i = rel.length - 1; 
        do{
            if( (mask & (1 << i)) !== 0){
                subset.push(rel[i]);
            }
        }while(i--);
        //if( result.length >= size){
        subsets.push(subset);
        //}
    }
	console.log(subsets);
	// check subsets for possible FD's
	subsets.forEach( function( v) {
		console.log("evaluating fd's on basis of "+v);
		//calculate closure
		var c = closure( v, dep, rel);
		arraySubtract( c, v); //c = c-v
		//console.log("calulated dff "+c+" - "+v+" = "+diff);
		if (c.length != 0){
			// found plausible FD
			// Check for nontrivialITY
			// abc -> a always holds (right side subset of left)
			// (not done, why?)
			//console.log("FD "+v+"->"+c+" (triv)");
			//all found "letters" must be in original relation
			if (arrayIn(rel, c)){
			  //console.log("FD "+v+"->"+c);
				depencencies[v] = c;
			}
			
			
		}
		//return v;
	});
	return depencencies;
    //return results;

}


function solveBCNF( rel, dep) {
	console.log("Evaluating "+rel);
	var bcnf = false;
	var solvedRel = [];
	var solvedDep = [];
	while (bcnf == false){
		bcnf = true;
		// Calculate closures of dependencies leftsides
		var closures = {};
		for (var depPart in dep){
			if (dep.hasOwnProperty( depPart)){
			//dep.forEach( function( v) {
				closures[depPart] = closure( [depPart], dep, rel);
			}
		}
		//check closures for candidate key / superkey
		for (var c in closures){
			if (closures.hasOwnProperty( c) && rel.indexOf( c) != -1){
				if (arraysEqual( closures[c], rel)){
					console.log(c+"->"+closures[c]+" is BCNF");
					solvedRel.push(rel);
				}else{
					console.log(c+"->"+closures[c]+" not in BCNF");
					
					//bcnf = false;
					// Ositus
					var rel1 = closures[c];
					var rel2 = [c];
					for (var i = 0; i < rel.length; i++){
						if (rel1.indexOf(rel[i]) == -1){
							rel2.push(rel[i]);
						}
					}
					rel2.sort();
					console.log("new div in "+rel1+" and "+rel2);
					// Projisoi riippuvuudet
					//rel1
					dep1 = project( rel1, dep);
					dep2 = project( rel2, dep);
					console.log("decomposing result:");
					
					console.log(rel1+": ");
					printDeps(dep1);
					console.log(rel2+":");
					printDeps(dep2);
					//Check for keys (recurse)...Closure of attributes in new relations
					
					break;
					//rekursio
				}
			}
		}
	}
	//return rel;

}
