
function JSONInNeo4j (json_object, neo4j_database)
{
	
return function ()
{

	var my = {};
	var my["node_modules"] = {};
	
	my["url"] = null;
	my["server_url"] = null;

	if ( typeof neo4j_database === "string" )
	{
		my["url"] = neo4j_database;
		my["server_url"] = neo4j_database.match("^(http|https):\/\/[a-z\.]+:[0-9]+")[0];
		my["node_modules"]["neo4j"] = require ("neo4j");
		my["neo4j_database"] = new my["node_modules"]["neo4j"].GraphDatabase (my["server_url"]);
	}
	else
	{
		my["neo4j_database"] = neo4j_database;
	}

	my["typeOf"] = function (value)
	{
		var s = typeof value;
		if (s === "object")
		{
			if (value)
			{
				if (value instanceof Array)
				{
					s = "array";
				}
			}
			else
			{
				s = "null";
			}
		}
		return s;
	};

	var that = function (node_or_callback)
	{
		var node = null;
		var callback = node_or_callback;
		if ( arguments.length > 1 )
		{
			node = node_or_callback;
			callback = arguments[1];
		}
		var type_of_json_root = my["typeOf"] (json_object);
		if ( type_of_json_root === "object" || type_of_json_root === "array" )
		{
			console.debug ("Create node to represent json of type "+type_of_json_root);
		}
		else
		{
			callback ("Invalid json: root must be array or object you gave '"+type_of_json_root+"'");
		}	
	};
	return that;
} ();
};

module.exports.JSONInNeo4j = JSONInNeo4j;
