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
function submitBCNF( e) {
  e.preventDefault();
  var data = $('#inputform :input').serializeArray();
  console.log(data);
  if (data[0].value != "" && data[1].value != "") {
    try {
      relation = parseRelation( data[0].value);
      dependencies = parseDependencies( data[1].value);
    }catch( e){
      showError( e);
    }
  }
}

function parseRelation( r) {
  //Input as A,B,C,D  parsed to array
  var relations = r.split(',');
  relations.forEach( function( v){ return v.trim()});
  return relations;
  //String.prototype.trim.apply(null, relations);
}
function parseDependencies( d) {
  //Input in form A->B, CD->E
  var deps = d.split(',');
  deps.forEach( function( v){ return v.trim()});
  
  var dependencies = [];
  deps.forEach( function( v){
    var index = v.indexOf('->');
    if ( index == -1){ // indexOf results in -1 if not found. -1 is in binary curiously 1111... and when taking it's compliment becomes zero. So indexOf actually returns False as a truth-value...
      throw new parseError('-> missing in "'+v+'"');
    }else {
      leftSide = v.substring( 0, index); 
      rightSide = v.substring( index+2); 
      var result = {};
      //result[ TODO:insert result into depencencies
      //dependencies.push( 
    }
  });
}
