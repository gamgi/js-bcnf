function parseError( message) {
  this.message = message;
  this.name = "parseError";
}

function print( msg, indent, toSolution) {
    if (toSolution === true) {
        $('#solution').append(msg);
        $('#solution').append('<br />');
    }else{
        if (indent == undefined)
            indent = 0;
        var indent = Array(indent+1).join("\t"); 
        $('#calculation').append(indent+msg);
        $('#calculation').append('<br />');
    }
}

function showError( error) {
  //Shows error to user. TODO:queue
  $("#warning").html('<strong>'+error.name+'</strong>: '+error.message);
  console.log(error);
  $("#warning").show().delay(5000).fadeOut();

};

function printDeps( deps, indent) {
    if (deps.length == 0) {
        print("None", indent);
        return;
    }
	for (var i = 0; i < deps.length; i++){
        print(deps[i].left+"->"+deps[i].right, indent);
	}
}
function uniqueFilter( value, index, self) {
    return self.indexOf( value) === index;
}
function arraySubtract(a, b){
	//subtracts b from a ....aka a - b
    var result = [];
    // Actually selects those elements form a that are not in b
	for (var i = 0; i < a.length; i++){
		if (b.indexOf(a[i]) == -1)
            result.push( a[i]);
	}
	return result;
}
function arrayIn( a, b) {
	// b's elements are in a
    for (var i = 0; i < b.length; i++) {
        if (a.indexOf(b[i]) == -1)
            return false;
    }
	return true;
}
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function arrayIntersect(a, b) {
    var result = [];
    for (var i = 0; i < a.length; ++i) {
        if (b.indexOf(a[i]) != -1)
            result.push( a[i]);
    }
    return result;
}

function submitBCNF( e) {
  e.preventDefault();
  var data = $('#inputform :input').serializeArray();
  console.log(data);
  if (data[0].value == "") {
      showError( new Error("No relation provided"));
  }else if (data[1].value == "") {
      $('#calculation').empty();
      $('#solution').empty();
      print( " No functional dependencies, relation is in BCNF");
      $('#solution').hide();
  } else if (data[0].value != "" && data[1].value != "") {
    try {
      $("#solution").fadeIn();
      $('#solution').empty().append("<b>Solution:</b><br />");
      $('#solution').empty().append("<b>Solution:</b><br />");
      $('#calculation').empty();
      var relation = parseRelation( data[0].value);
      var dependencies = parseDependencies( data[1].value);
	  solveBCNF( relation, dependencies);
    }catch( e){
      showError( e);
      $('#solution').hide();
    }
  }
}

function parseRelation( r) {
  // Input as A,B,C,D  parsed to array
  var relations = r.split(',');
  relations.forEach( function( v){ return v.trim()});

  // Remove duplicates
  return relations.sort().filter( uniqueFilter);
}

function trimArray( a) {
	a.forEach( function( v){ return v.trim()});
	return a;
}

function DepObj( a, b) {
    // Dependency object. Describes a dependency between two relations [] -> []
    this.left = a;
    this.right = b;
}
function parseDependencies( d) {
    //Input in form A->B, CD->E
    var deps = d.split(';');
    trimArray( deps);

    var dependencies = [];
    deps.forEach( function( v){
        var index = v.indexOf('->');
        if ( index == -1){
            throw new parseError('-> missing in "'+v+'"');
        }else {
            var leftSide = v.substring( 0, index).split(',');
            var rightSide = v.substring( index+2).split(','); 
            trimArray( leftSide);
            trimArray(rightSide);
            // Check for nontrivial dependencies
            // abc -> a always holds (right side subset of left)
            for (var i = 0; i < rightSide.length; i++){
                //if ( leftSide.indexOf( rightSide[i]) == -1) {
                if (arrayIn(leftSide, rightSide[i]) == false){
                    // Found something that's nontrivial
                    // add it to dependencies
                    dependencies.push(new DepObj( leftSide, rightSide));
                    //dependencies[ leftSide] = rightSide;
                    break;
                }
            }
        }
    });
    return dependencies;
}

function closure( rel, dep, origRel) {
	// calculates closure of rel according to dep. If supplied origRel is used as attributes that closure must consist of
	var result = [];
	//copy rel into result
	rel.forEach(function(v){
        // koska joskus rel voi olla myös monta attribuuttia ("A,B") niin split
        result.push( v);
        //result = result.concat(v.split(',')); //TODO more efficient
         
        //result.push(v);
    });
	//rel.forEach( function( v) {
	var iterating = true;
	var i = 0;
	//console.log("before:"+rel);
	while ( iterating){
		iterating = false;
        dep.forEach( function( d){
            if (arrayIn( result, d.left)) { //current closure content matches dependency left side
                var add = arraySubtract(d.right, result);
                if (add.length > 0 ){ //if there is something new to add
                    if (origRel != undefined) { //allow only addition of elements in origRel
                        add = arrayIntersect(add, origRel);
                    }
                    if (add.length > 0) {
                        result = result.concat( add);
                        iterating = true;		
                    }
                }
            }
        });
		//varotoimi
		i++;
		if (i>50){
			print("overlfow");
			break;
		}
	}
	//console.log("after:"+rel.sort());
	return result.sort();
	//});
	
}
function project( rel, dep, level) {
	// Projects deps onto rel
    // Level only affects amoutn of indentation
    level++;
	var dependencies = [];
	//console.log("Projecting FD's onto "+rel)
	print("Projecting FD's onto "+rel, level)
    level++;
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
        subsets.push(subset.sort()); //TODO should sort?
    }
	console.log(subsets);
	// check subsets for possible FD's
	subsets.forEach( function( sub) {
		//console.log("Evaluating fd's on basis of "+sub);
		print("Evaluating fd's on basis of "+sub, level);
		// Calculate closure
		var c = closure( sub, dep, rel);
        // Is there something in the closure that's not in the subset
		var diff = arraySubtract( c, sub);
        //console.log("  diff "+c+ " and "+sub+" = "+diff);
		if (diff.length > 0){
			// Found plausible FD
            // Check if we have stronker FD's already (part of sub is in other FD)
            var weak = false;
            for (var i = 0; i < dependencies.length; i++){
                for (var j = 0; j < sub.length; j++) {
                    if (dependencies[i].left.indexOf(sub[j]) != -1)
                        weak = true;
                        break;
                    //if (arrayIn( dependencies[i].left, [sub[j]])
                }
            }
            if (! weak){
                // Check for nontriviality
                // (check is included in difference above)
                
                // All found attributes must be in original relation (rel)
                if (arrayIn(rel, diff)){
                    dependencies.push(new DepObj( sub, diff));
                    //console.log("  "+sub+"->"+diff);
                    print(sub+"->"+diff, level);
                }
            }
		}
	});
	return dependencies;

}


function solveBCNF( rel, dep, indent, count) {
    if (indent == undefined || count == undefined){
        indent = 0;
        count = 0;
    }
	print("Evaluating R("+rel+")",indent);
    count++;
	var bcnf = true;
	var solvedRel = [];
	var solvedDep = [];
    // Calculate closures of dependencies leftsides
    var closures = {};
    if (dep.length == 0){
        print("no FD's. Relation is BCNF",indent+1);
    }else{
        for (var i = 0; i < dep.length; i++){
            var d = dep[i];
            var c = closure( d.left, dep, rel);
            // Check calculated closure for candidate key / superkey
            if ( arraysEqual( c, rel)){
                // Is superkey
                print("\t"+d.left+"->"+d.right+" is BCNF",indent);
            }else{
                // Is not superkey, must be decomposed
                print("\t"+d.left+"->"+d.right+" is not BCNF", indent);
                bcnf = false;
                // Decompose
                var r1 = c; //R1 = closure
                var r2 = arraySubtract(rel, r1).concat( d.left); // R2 = left side + rest
                r2.sort();
                print("Decomposing into R"+(count)+"("+r1+") and R"+(count+1)+"("+r2+")", indent);
                // Project dependencies
                var d1 = project( r1, dep, indent);
                var d2 = project( r2, dep, indent);
                // Print results
                print("Decomposed result:",indent);
                print("R"+count+"("+r1+"):", indent);
                printDeps(d1, indent+1);
                print("R"+(count+1)+"("+r2+"):", indent);
                printDeps(d2, indent+1);
                print("-- end of iteration  --",indent);
                //insert recursion
                count = solveBCNF( r1, d1, indent, count+1);
                count = solveBCNF( r2, d2, indent, count);
                break;
            }
        }
    }
    if (bcnf == true) {
        print("R("+rel+")", 0, true);
    }
	return count;
}
