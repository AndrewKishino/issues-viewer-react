var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router').Router;
var Route = require('react-router').Route;
var Link = require('react-router').Link;
var createHistory = require('history').createHashHistory;
var request = require('request');
var ReactPaginate = require('react-paginate');
var moment = require('moment');

var Home = React.createClass({
  handleRequestSubmit: function(obj) {
    var location = "/" + obj.owner + "/" + obj.repo + "/issues/";
    history.pushState(null, location);
  },
  getInitialState: function() {
    return {owner: '', repo: ''};
  },
  componentDidMount: function() {
  },
  render: function() {
    localStorage.clear();
    return (
      <div className="home">
        <div className="home-title">
          <h1>Github Issues Explorer</h1>
        </div>
        <SearchForm onIssueSubmit={this.handleRequestSubmit} />
      </div>
    );
  }
});

var SearchForm = React.createClass({
  getInitialState: function() {
    return {owner: '', repo: ''};
  },
  handleOwnerChange: function(e) {
    this.setState({owner: e.target.value});
  },
  handleRepoChange: function(e) {
    this.setState({repo: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var owner = this.state.owner.trim();
    var repo = this.state.repo.trim();
    if (!repo || !owner) {
      return;
    }
    this.props.onIssueSubmit({owner: owner, repo: repo});
  },
  render: function() {
    return (
      <form className="searchForm" onSubmit={this.handleSubmit}>
        <input
          className="searchField"
          type="text"
          id="owner"
          placeholder="Owner"
          value={this.props.owner}
          onChange={this.handleOwnerChange}
        />
        <input
          className="searchField"
          type="text"
          id="repo"
          placeholder="Repository"
          value={this.props.repo}
          onChange={this.handleRepoChange}
        />
        <input className="searchField" type="submit" value="Search" />
      </form>
    );
  }
});

var IssuesBox = React.createClass({
  handlePageClick: function(data) {
    this.setState({ page: data.selected+1}, (function () {
      this.setState({data: []});
      localStorage.removeItem(this.state.owner + this.state.repo + 'GithubViewerData');
      if(localStorage.getItem('state')) {
        this.loadIssuesFromServer(localStorage.getItem('state'));
      } else {
        this.loadIssuesFromServer('open');
      }
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    }).bind(this));
  },
  switchClick: function(e) {
    this.setState({ page: 1}, (function () {
      this.setState({data: []});
      localStorage.removeItem(this.state.owner + this.state.repo + 'GithubViewerData');
      if(e === true) {
        localStorage.setItem('checked', 'checked');
        localStorage.setItem('state', 'closed');
        this.setState({state: 'closed'}, function() {
          this.loadIssuesFromServer('closed');
        });
      } else {
        localStorage.setItem('checked', '');
        localStorage.setItem('state', 'open');
        this.setState({state: 'open'}, function() {
          this.loadIssuesFromServer('open');
        });
      }
      document.body.scrollTop = document.documentElement.scrollTop = 0;
    }).bind(this));
  },
  getInitialState: function() {
    if(!!localStorage.getItem('state')) {
      return {data: [], owner: this.props.params.owner, repo: this.props.params.repo, page: 1, state: localStorage.getItem('state')};
    } else {
      return {data: [], owner: this.props.params.owner, repo: this.props.params.repo, page: 1, state: 'open'};
    }
  },
  componentDidMount: function() {
    if(localStorage.getItem('state')) {
      this.loadIssuesFromServer(localStorage.getItem('state'))
    } else {
      this.loadIssuesFromServer('open')
    }
  },
  loadIssuesFromServer: function(state) {
    if(localStorage.getItem(this.props.params.owner + this.props.params.repo + 'GithubViewerData')) {
      var localData = localStorage.getItem(this.state.owner + this.state.repo + 'GithubViewerData');
      localData = JSON.parse(localData);
      var matches;
      var pages = [];
      var re = /\&page=(\d+)/g;
      while ((matches = re.exec(localData.headers.link)) != null) {
        pages.push(Number(matches[1]));
      }
      this.setState({data: JSON.parse(localData.body), pageNum: pages[1]-1, nextPage: pages[0], state: localStorage.getItem('state')});
    } else {
      localStorage.removeItem(this.state.owner + this.state.repo + 'GithubViewerData');
      request.get("https://api.github.com/repos/" + this.state.owner + "/" + this.state.repo + "/issues?state=" + state + "&page=" + this.state.page + "&per_page=25", function(err, data) {
        var matches;
        var pages = [];
        var re = /\&page=(\d+)/g;
        while ((matches = re.exec(data.headers.link)) != null) {
          pages.push(Number(matches[1]));
        }
        this.setState({data: JSON.parse(data.body), pageNum: pages[1]-1, nextPage: pages[0]});
        localStorage.setItem(this.state.owner + this.state.repo + 'GithubViewerData', JSON.stringify(data));
      }.bind(this));
    }
  },
  render: function() {
    return (
      <div className="issuesBox">
        <Link to="/"><h1>Github Issues Explorer</h1></Link>
        <hr/>
        <IssueList switchClick={this.switchClick} owner={this.props.params.owner} repo={this.props.params.repo} data={this.state.data} />
        <div className="pagination-box">
          <ReactPaginate previousLabel={"Previous"}
                       nextLabel={"Next"}
                       breakLabel={<li className="break"><span>...</span></li>}
                       pageNum={this.state.pageNum}
                       marginPagesDisplayed={2}
                       pageRangeDisplayed={5}
                       containerClassName={"pagination"}
                       subContainerClassName={"pages pagination"}
                       clickCallback={this.handlePageClick}
                       activeClassName={"active-page"}/>
       </div>
      </div>
    );
  }
});

var IssueList = React.createClass({
  switchClick: function(e) {
    this.props.switchClick(e.target.checked);
  },
  render: function() {
    var issueNodes = this.props.data.map(function(issue) {
      var re = /repos\/(.+)\/(.+)\/issues/;
      var match = re.exec(issue.url);
      return (
        <div key={issue.id} className="list-group-item">
          <Issue
            id={issue.id}
            owner={match[1]}
            repo={match[2]}
            number={issue.number}
            title={issue.title} 
            labels={issue.labels} 
            username={issue.user.login} 
            avatar={issue.user.avatar_url}
            summary={issue.body}
            created={issue.created_at}
            comments={issue.comments}
            state={issue.state}/>
        </div>
      );
    });

    return (
      <div className="issueList">
        <div className="panel panel-default">
          <div className="panel-heading location-heading">
            <span>{this.props.owner} / {this.props.repo}</span>

            <div className="switch">
              <input id="toggle-1" 
                     className="toggle toggle-round" 
                     type="checkbox"
                     defaultChecked={localStorage.getItem('checked')}
                     onChange={this.switchClick}/>
              <label htmlFor="toggle-1"></label>
            </div>

            <span className="switch-label">Show closed</span>
          </div>
          
          <div className="list-group">
            {issueNodes}
          </div>
        </div>
      </div>
    );

  }
});

var Issue = React.createClass({
  rawMarkup: function() {
    if(this.props.summary) {
      var rawMarkup = marked(this.props.summary.toString().replace(/\@([\d\w]+)/g, '[@$1](https://github.com/$1)').replace(/<\/*cite>/g, ''), {sanitize: true});
      return { __html: rawMarkup };
    } else {
      return { __html: '' };
    }
  },

  strip: function(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText;
  },

  render: function() {
    var trimmedString = this.strip(this.rawMarkup().__html).substr(0, 140);
    trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
    trimmedString = { __html: trimmedString };
    var opened = { __html: "<span class='octicon octicon-issue-opened open-state'></span>" };
    var closed = { __html: "<span class='octicon octicon-issue-closed closed-state'></span>" };
    var state = this.props.state === 'open' ? opened : closed;

    return (
      <div className="issue">
        <img className="avatar" src={this.props.avatar}/>
        <span dangerouslySetInnerHTML={state}/>
        <div className="issues-title">
          <strong><Link to={`/${this.props.owner}/${this.props.repo}/issues/${this.props.number}`}>{this.props.title}</Link></strong>
        </div>
        {this.props.labels.map(function(label, index) {
          var style = {
            backgroundColor: '#' + label.color
          }
          return (
            <span key={label.url} className="label label-default issues-label" style={style}>{label.name}</span>
          )
        })}
        <div className="issues-meta">
          #{this.props.number} opened {moment(this.props.created).fromNow()} by {this.props.username}
        </div>
        <div className="issues-comments">
          <span>{this.props.comments} comments </span><span className="octicon octicon-comment"></span>
        </div>
        <span className="issues-summary" dangerouslySetInnerHTML={trimmedString}></span>
      </div>
    );
  }
});

var IssueDetails = React.createClass({
  getInitialState: function() {
    return {data: [], owner: this.props.params.owner, repo: this.props.params.repo, labels: []};
  },

  loadIssueDetails: function() {
    $.ajax({
      url: "https://api.github.com/repos/" + this.props.params.owner + "/" + this.props.params.repo + "/issues/" + this.props.params.issueid,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data, labels: data.labels, user: data.user});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  loadIssueComments: function() {
    $.ajax({
      url: "https://api.github.com/repos/" + this.props.params.owner + "/" + this.props.params.repo + "/issues/" + this.props.params.issueid + "/comments",
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({comments: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  componentWillMount: function() {
    this.loadIssueDetails();
    this.loadIssueComments();
  },

  rawMarkup: function(markup) {
    var rawMarkup = marked(markup.toString().replace(/\@([\d\w]+)/g, '[@$1](https://github.com/$1)').replace(/<\/*cite>/g, ''), {sanitize: true});
    return { __html: rawMarkup };
  },

  render: function() {
    var opened = { __html: "<span class='label label-default issue-label issue-label-open'><span class='octicon octicon-issue-opened'></span> " + this.state.data.state + "</span>" };
    var closed = { __html: "<span class='label label-default issue-label issue-label-closed'><span class='octicon octicon-issue-closed'></span> " + this.state.data.state + "</span>" };
    var state = this.state.data.state === 'open' ? opened : closed;

    if(this.state.user && this.state.comments) {
      return (
        <div className="issue-box">
          <div className="issue-details">
            <div className="issue-title">
              <span>{this.state.data.title} <font className="issue-num">#{this.state.data.number}</font></span>
              {this.state.data.labels.map(function(label, index) {
                var style = {
                  backgroundColor: '#' + label.color
                }
                return (
                  <span key={label.url} className="label label-default issue-label-title" style={style}>{label.name}</span>
                )
              })}
            </div>
            <div className="issue-meta">
              <span dangerouslySetInnerHTML={state}/>
              <span><strong>{this.state.data.user.login}</strong> opened this issue {moment(this.state.data.created_at).fromNow()} - {this.state.data.comments} comments</span>
            </div>
            <hr/> 
            <img className="issue-avatar" src={this.state.data.user.avatar_url}/>
            <div className="panel panel-default issue-panel">
              <div className="panel-heading"><strong>{this.state.data.user.login}</strong> commented  {moment(this.state.data.created_at).fromNow()}</div>
              <div className="panel-body">
                <span dangerouslySetInnerHTML={this.rawMarkup(this.state.data.body)}/><br/>
              </div>
            </div>
          </div>
          <hr/>
          <div className="issue-comments">
            {this.state.comments.map(function(comment, index) {
              return (
                <div key={comment.id} className="comment">

                  <img className="issue-avatar" src={comment.user.avatar_url}/>
                  <div className="panel panel-default issue-panel">
                    <div className="panel-heading"><strong>{this.state.data.user.login}</strong> commented  {moment(comment.created_at).fromNow()}</div>
                    <div className="panel-body">
                      <span dangerouslySetInnerHTML={this.rawMarkup(comment.body)}/><br/>
                    </div>
                  </div>
                  <hr/>
                </div>
              )
            }.bind(this))}
          </div>
        </div>
      );
    } else {
      return (
      <div className="issue-box">
        <div className="issue-details">
        <h2>{this.state.data.title}</h2>
        <span>{this.state.data.state}</span><br/>
        <h4>
          {this.state.labels.map(function(label, index) {
            return (
              <span key={label.url}>{label.name}&nbsp;</span>
            )
          })}
        </h4>
        <span>{this.state.data.body}</span><br/>
        </div>
      </div>
    );
    }
  }
});

var history = createHistory({
  queryKey: false
});

ReactDOM.render((
    <Router history={history}>
      <Route path="/" component={Home}/>
      <Route path="/:owner/:repo/issues" component={IssuesBox}/>
      <Route path="/:owner/:repo/issues/:issueid" component={IssueDetails}/>
    </Router>
  ), document.getElementById('content')
);
