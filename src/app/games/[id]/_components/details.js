import { Fragment } from 'react';
import Category from './category';

const getCompaniesByRole = (companies, role) =>
  companies?.reduce((acc, value) => {
    return value[role] ? [...acc, { ...value.company }] : acc;
  }, []);

const Details = ({
  release_dates,
  websites,
  involved_companies,
  player_perspectives,
  game_modes,
  game_engines,
  themes,
}) => {
  const developers = getCompaniesByRole(involved_companies, 'developer');
  const publishers = getCompaniesByRole(involved_companies, 'publisher');

  const links = websites?.filter((website) =>
    [1, 3, 5, 6, 9, 14, 18].includes(website.category)
  );

  const stores = websites?.filter((website) =>
    [13, 16, 17].includes(website.category)
  );

  const releases = release_dates
    ? Array.from(
        release_dates
          .reduce(
            (m, o) => (!m.has(o.platform.id) ? m.set(o.platform.id, o) : m),
            new Map()
          )
          .values()
      )
    : [];

  return (
    <div className='mt-4 xl:mt-6 md:grid grid-cols-2 gap-x-8 lg:gap-8 xl:grid-cols-3 xl:gap-10 '>
      <div>
        <h2 className='text-lg font-bold mb-2'>Release Dates</h2>
        <div className='grid grid-cols-3 gap-1 mb-4 text-slate-300'>
          {releases.length
            ? releases.map((release) => (
                <Fragment key={release.id}>
                  <span className='col-span-2'>{release.platform.name}</span>
                  <span className='text-right'>{release.human}</span>
                </Fragment>
              ))
            : '暂无'}
        </div>

        <Category
          title='开发商'
          items={developers}
          field='involved_companies.company'
        />
        <Category
          title='发行商'
          items={publishers}
          field='involved_companies.company'
        />
      </div>

      <div>
        <Category title='游戏模式' items={game_modes} field='game_modes' />
        <Category
          title='玩家视角'
          items={player_perspectives}
          field='player_perspectives'
        />
        <Category title='主题' items={themes} field='themes' />
        <Category
          title='游戏引擎'
          items={game_engines}
          field='game_engines'
        />
      </div>

      <div>
        <Category title='相关链接' items={links} />
        <Category title='商店' items={stores} />
      </div>
    </div>
  );
};

export default Details;
