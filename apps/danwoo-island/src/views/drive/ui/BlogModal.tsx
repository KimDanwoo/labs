import { BLOG_URL } from '@views/drive/config/menu';
import { PanelHeader } from '@views/drive/ui/PanelHeader';

export function BlogModal() {
  return (
    <div className="js-modal modal blog" data-name="blog">
      <div className="panel-card">
        <PanelHeader title="최신 글 게시판" badge="BLOG" />
        <ul className="js-blog-posts blog-posts" />
        <a className="blog-all" href={BLOG_URL} target="_blank" rel="noopener noreferrer">
          블로그 전체 보기
        </a>
      </div>
    </div>
  );
}
