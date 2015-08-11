<!DOCTYPE HTML>
<html>
@section('page_title')
@yield('title')
@stop
<head>
	<meta charset="utf-8">
	<title>
		@yield('title')
	</title>
	{{HTML::style('css/common.css')}}
	{{HTML::style('css/page.css')}}
	{{HTML::style('css/layout.css')}}
	{{HTML::style('css/color.css')}}
	{{HTML::script('js/jquery-1.11.1.min.js')}}
	{{HTML::script('js/common.js')}}
	@yield('head')
</head>
<?php
if (Auth::check()) {
    $user_pref = Auth::user()->preferences;
    $class_theme = $user_pref['theme'];
} else {
    $class_theme = 'mode_white';
}
?>
<body class="{{$class_theme}}">
	<div id="wrapper">
		<div id="header">
			@if (Auth::check())
			<nav id="main_nav">
				<ul>
					<li>
						<a href="{{asset('home')}}"><img src="{{asset('img/common/header-logo.png')}}" alt="CIRCUS" class="header_logo"></a></li>
					<li>
						<a href="{{asset('case/search')}}"><span class="case"></span>Case</a>
						<ul>
							<li><a href="{{asset('case/search')}}">Case Search</a></li>
							@if (isset(Auth::user()->preferences['caseSearchPresets']))
							@foreach(Auth::user()->preferences['caseSearchPresets'] as $index => $val)
								<li>{{HTML::link(asset('case/search/' . $index), $val['save_label'])}}</li>
							@endforeach
							@endif
						</ul>
					</li>
					<li>
						<a href="{{asset('series/search')}}"><span class="series"></span>Series</a>
						<ul>
							<li><a href="{{asset('series/search')}}">Series Search</a></li>
							<li><a href="{{asset('series/import')}}">Series Import</a></li>
							@if (isset(Auth::user()->preferences['seriesSearchPresets']))
							@foreach(Auth::user()->preferences['seriesSearchPresets'] as $index => $val)
								<li>{{HTML::link(asset('series/search/' . $index), $val['save_label'])}}</li>
							@endforeach
							@endif
						</ul>
					</li>
					<li>
						<a href="{{asset('share/search')}}"><span class="share"></span>Share</a>
					</li>
					@if (Auth::user()->hasPrivilege(Group::SERVER_MANAGE))
					<li>
						<a href="{{asset('administration')}}"><span class="admin"></span>Administration</a>
						<ul>
							<li><a href="{{asset('administration/group')}}">Group</a></li>
							<li><a href="{{asset('administration/user')}}">User</a></li>
							<li><a href="{{asset('administration/storage')}}">Storage</a></li>
							<li><a href="{{asset('administration/project')}}">Project</a></li>
							<li><a href="{{asset('administration/server_param')}}">Setting Server Params</a></li>
						</ul>
					</li>
					@endif
				</ul>
			</nav>
			<nav id="sub_nav">
				<ul>
					<li id="user_info">{{Auth::user()->description}}</li>
					<li id="color_select"><a id="color_switch"></a>	</li>
					<li><a href="{{asset('preference')}}"><span class="preference"></span>Preference</a></li>
					<li><a href="{{asset('logout')}}"><span class="logout"></span>Logout</a></li>
				</ul>
			</nav>
			@else
			<img src="{{asset('img/common/header-logo.png')}}" alt="CIRCUS" class="header_logo">
			@endif
		</div>
		<div class="page_contents" @yield('page_id')>
			<h1 class="page_title">
			@yield('page_title')
			</h1>
			@yield('content')
		</div>
	</div>
	</body>
</html>